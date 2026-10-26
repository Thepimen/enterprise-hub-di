/**
 * @file ticket.model.ts
 * @description Modelos de dominio para el sistema de tickets técnicos B2B.
 */

/** Estados posibles de un ticket */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/** Prioridades de ticket */
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Categorías de ticket */
export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'SECURITY' | 'OTHER';

/** Modelo principal de ticket */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: string[];
}

/** Payload para crear un nuevo ticket */
export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  tags?: string[];
}

/** Estadísticas resumidas para el Dashboard */
export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  criticalCount: number;
  avgResolutionTimeHours: number;
}

/** Columna para el componente DataTable */
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}
