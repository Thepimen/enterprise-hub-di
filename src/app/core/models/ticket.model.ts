/**
 * @file ticket.model.ts
 * @description Modelos de dominio para el sistema de tickets técnicos B2B.
 * Incluye DTOs inmutables con propiedades 'readonly' para prevención de mutaciones involuntarias
 * y cumplimiento de arquitectura defensiva (Defensa en Profundidad).
 */

/** Estados posibles de un ticket */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/** Prioridades de ticket */
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Categorías de ticket */
export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'SECURITY' | 'OTHER';

/** Modelo principal de ticket */
export interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly category: TicketCategory;
  readonly assignedTo?: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly resolvedAt?: Date;
  readonly tags: readonly string[];
}

/**
 * Payload inmutable (DTO) para registrar una nueva incidencia.
 * Los campos 'readonly' impiden la alteración de datos tras su validación.
 */
export interface CreateTicketPayload {
  readonly title: string;
  readonly description: string;
  readonly priority: TicketPriority;
  readonly category: TicketCategory;
  readonly tags?: readonly string[];
}

/** Estadísticas resumidas para el Dashboard */
export interface TicketSummary {
  readonly total: number;
  readonly open: number;
  readonly inProgress: number;
  readonly resolved: number;
  readonly closed: number;
  readonly criticalCount: number;
  readonly avgResolutionTimeHours: number;
}

/** Columna para el componente DataTable */
export interface TableColumn {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly width?: string;
}
