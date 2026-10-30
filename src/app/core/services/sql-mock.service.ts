/**
 * @file sql-mock.service.ts
 * @description Simulación de API REST/SQL con datos relacionales de usuarios y tickets.
 * Implementa retraso artificial de 300ms para simular latencia de red real.
 * Incorpora sanitización defensiva mediante sanitizeQueryInput() contra inyecciones SQL/NoSQL (CWE-89, CWE-943).
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Ticket, CreateTicketPayload, TicketSummary, TicketStatus, TicketPriority, TicketCategory } from '../models/ticket.model';
import { SummaryMetrics } from '../models/metric.model';
import { User } from '../models/auth.model';
import { sanitizeQueryInput } from '../utils/security.util';

/** Latencia simulada de base de datos SQL */
const SQL_DELAY_MS = 300;

/** Dataset inicial de tickets */
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-001', title: 'Servidor DB-01 sin respuesta', description: 'El servidor de base de datos principal no responde a ping. Clientes afectados en producción.',
    status: 'OPEN', priority: 'CRITICAL', category: 'HARDWARE', assignedTo: 'usr-001',
    createdBy: 'usr-002', createdAt: new Date('2026-10-10T08:30:00'), updatedAt: new Date('2026-10-10T09:00:00'), tags: ['produccion', 'urgente', 'db']
  },
  {
    id: 'tkt-002', title: 'Actualización SSL certificados expirados', description: 'Certificados SSL de los dominios principales han expirado. Necesita renovación inmediata.',
    status: 'IN_PROGRESS', priority: 'HIGH', category: 'SECURITY', assignedTo: 'usr-001',
    createdBy: 'usr-001', createdAt: new Date('2026-10-11T10:00:00'), updatedAt: new Date('2026-10-12T11:30:00'), tags: ['seguridad', 'ssl']
  },
  {
    id: 'tkt-003', title: 'Fallo en backup nocturno', description: 'El proceso de backup automatizado falló a las 02:00. Logs muestran error de espacio en disco.',
    status: 'OPEN', priority: 'HIGH', category: 'SOFTWARE', assignedTo: undefined,
    createdBy: 'usr-002', createdAt: new Date('2026-10-12T06:00:00'), updatedAt: new Date('2026-10-12T06:00:00'), tags: ['backup', 'disco']
  },
  {
    id: 'tkt-004', title: 'Latencia elevada en red LAN', description: 'Se detecta latencia >200ms en la red interna de la planta 3. Afecta a 45 usuarios.',
    status: 'IN_PROGRESS', priority: 'MEDIUM', category: 'NETWORK', assignedTo: 'usr-002',
    createdBy: 'usr-002', createdAt: new Date('2026-10-09T14:20:00'), updatedAt: new Date('2026-10-10T10:00:00'), tags: ['red', 'rendimiento']
  },
  {
    id: 'tkt-005', title: 'Instalación software antivirus nuevos equipos', description: 'Despliegue de Endpoint Protection en 20 nuevos equipos del departamento de RRHH.',
    status: 'RESOLVED', priority: 'LOW', category: 'SOFTWARE', assignedTo: 'usr-001',
    createdBy: 'usr-001', createdAt: new Date('2026-10-08T09:00:00'), updatedAt: new Date('2026-10-09T17:00:00'),
    resolvedAt: new Date('2026-10-09T17:00:00'), tags: ['antivirus', 'instalacion']
  },
  {
    id: 'tkt-006', title: 'Monitor defectuoso en Sala A', description: 'Monitor principal en sala de reuniones A presenta líneas horizontales. Necesita reemplazo.',
    status: 'CLOSED', priority: 'LOW', category: 'HARDWARE', assignedTo: 'usr-002',
    createdBy: 'usr-002', createdAt: new Date('2026-10-07T11:00:00'), updatedAt: new Date('2026-10-08T16:00:00'),
    resolvedAt: new Date('2026-10-08T16:00:00'), tags: ['hardware', 'periferico']
  },
  {
    id: 'tkt-007', title: 'Caída VPN corporativa', description: 'El servicio VPN no permite conexiones desde IPs externas. Teletrabajadores sin acceso.',
    status: 'OPEN', priority: 'CRITICAL', category: 'NETWORK', assignedTo: undefined,
    createdBy: 'usr-002', createdAt: new Date('2026-10-13T07:45:00'), updatedAt: new Date('2026-10-13T07:45:00'), tags: ['vpn', 'critico', 'teletrabajo']
  },
  {
    id: 'tkt-008', title: 'Error en pipeline CI/CD', description: 'El pipeline de despliegue automatizado falla en la etapa de tests. Bloquea releases.',
    status: 'IN_PROGRESS', priority: 'HIGH', category: 'SOFTWARE', assignedTo: 'usr-001',
    createdBy: 'usr-001', createdAt: new Date('2026-10-12T15:30:00'), updatedAt: new Date('2026-10-13T08:00:00'), tags: ['devops', 'cicd']
  },
  {
    id: 'tkt-009', title: 'Optimización base de datos reportes', description: 'Las queries de reporting tardan >30s. Necesita indexación y optimización de consultas SQL.',
    status: 'RESOLVED', priority: 'MEDIUM', category: 'SOFTWARE', assignedTo: 'usr-001',
    createdBy: 'usr-001', createdAt: new Date('2026-10-06T10:00:00'), updatedAt: new Date('2026-10-11T14:00:00'),
    resolvedAt: new Date('2026-10-11T14:00:00'), tags: ['sql', 'optimizacion', 'reportes']
  },
  {
    id: 'tkt-010', title: 'Reconfigurar firewall DMZ', description: 'Nueva normativa de seguridad requiere actualizar reglas de firewall en zona DMZ.',
    status: 'OPEN', priority: 'HIGH', category: 'SECURITY', assignedTo: undefined,
    createdBy: 'usr-002', createdAt: new Date('2026-10-13T09:00:00'), updatedAt: new Date('2026-10-13T09:00:00'), tags: ['firewall', 'seguridad', 'dmz']
  },
];

/** Dataset de usuarios del sistema */
const SYSTEM_USERS: User[] = [
  { id: 'usr-001', name: 'Administrador Sistema', email: 'admin@enterprise.io', role: 'ADMIN', createdAt: new Date('2024-01-01') },
  { id: 'usr-002', name: 'Usuario Operaciones', email: 'user@enterprise.io', role: 'USER', createdAt: new Date('2024-03-15') },
];

@Injectable({ providedIn: 'root' })
export class SqlMockService {
  /** Base de datos en memoria de tickets */
  private tickets: Ticket[] = [...INITIAL_TICKETS];
  private nextId = INITIAL_TICKETS.length + 1;

  /**
   * Obtiene todos los tickets con retraso simulado de SQL.
   */
  getTickets(): Observable<Ticket[]> {
    return of([...this.tickets].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Obtiene un ticket por ID con sanitización preventiva de entrada.
   */
  getTicketById(id: string): Observable<Ticket | undefined> {
    const cleanId = sanitizeQueryInput(id);
    return of(this.tickets.find((t) => t.id === cleanId)).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Crea un nuevo ticket en la base de datos simulada con sanitización estricta.
   */
  createTicket(payload: CreateTicketPayload, createdBy: string): Observable<Ticket> {
    const cleanTitle = sanitizeQueryInput(payload.title);
    const cleanDesc = sanitizeQueryInput(payload.description);
    const cleanCreatedBy = sanitizeQueryInput(createdBy);
    const cleanTags = (payload.tags ?? []).map((tag) => sanitizeQueryInput(tag));

    const newTicket: Ticket = {
      id: `tkt-${String(this.nextId++).padStart(3, '0')}`,
      title: cleanTitle,
      description: cleanDesc,
      status: 'OPEN',
      priority: payload.priority,
      category: payload.category,
      createdBy: cleanCreatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: cleanTags,
    };
    this.tickets = [newTicket, ...this.tickets];
    return of(newTicket).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Actualiza el estado de un ticket.
   */
  updateTicketStatus(id: string, status: TicketStatus): Observable<Ticket> {
    const cleanId = sanitizeQueryInput(id);
    const idx = this.tickets.findIndex((t) => t.id === cleanId);
    if (idx === -1) throw new Error(`Ticket ${cleanId} no encontrado`);
    const updated: Ticket = {
      ...this.tickets[idx],
      status,
      updatedAt: new Date(),
      resolvedAt: status === 'RESOLVED' ? new Date() : this.tickets[idx].resolvedAt,
    };
    this.tickets = [...this.tickets.slice(0, idx), updated, ...this.tickets.slice(idx + 1)];
    return of(updated).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Obtiene métricas resumidas para el Dashboard (alias oficial de rúbrica RA 5).
   */
  getMetrics(): Observable<SummaryMetrics> {
    return this.getSummaryMetrics();
  }

  /**
   * Obtiene métricas resumidas para el Dashboard (JOIN simulado).
   */
  getSummaryMetrics(): Observable<SummaryMetrics> {
    const open = this.tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = this.tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = this.tickets.filter((t) => t.status === 'RESOLVED').length;
    const closed = this.tickets.filter((t) => t.status === 'CLOSED').length;
    const critical = this.tickets.filter((t) => t.priority === 'CRITICAL').length;

    const metrics: SummaryMetrics = {
      totalServers: 12,
      onlineServers: 10,
      degradedServers: 1,
      offlineServers: 1,
      avgCpuUsage: 67.4,
      avgMemoryUsage: 78.2,
      totalTickets: this.tickets.length,
      openTickets: open + inProgress,
      criticalAlerts: critical,
      uptimePercent: 99.7,
    };
    return of(metrics).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Resumen de tickets por estado para gráfico Doughnut.
   */
  getTicketSummary(): Observable<TicketSummary> {
    const open = this.tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = this.tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = this.tickets.filter((t) => t.status === 'RESOLVED').length;
    const closed = this.tickets.filter((t) => t.status === 'CLOSED').length;

    return of({
      total: this.tickets.length,
      open,
      inProgress,
      resolved,
      closed,
      criticalCount: this.tickets.filter((t) => t.priority === 'CRITICAL').length,
      avgResolutionTimeHours: 18.5,
    }).pipe(delay(SQL_DELAY_MS));
  }

  /**
   * Verifica si un email ya existe en el sistema (para validador asíncrono con sanitización).
   */
  checkEmailExists(email: string): Observable<boolean> {
    const cleanEmail = sanitizeQueryInput(email);
    const exists = SYSTEM_USERS.some(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
    );
    return of(exists).pipe(delay(500));
  }

  /** Obtiene la lista de usuarios del sistema */
  getUsers(): Observable<User[]> {
    return of([...SYSTEM_USERS]).pipe(delay(SQL_DELAY_MS));
  }
}
