/**
 * @file metric.model.ts
 * @description Modelos de dominio para métricas de infraestructura en tiempo real.
 * Consumido por NoSqlMockService y DashboardComponent.
 */

/** Métrica individual de un servidor */
export interface ServerMetric {
  serverId: string;
  serverName: string;
  cpuUsage: number;       // 0-100 %
  memoryUsage: number;    // 0-100 %
  diskUsage: number;      // 0-100 %
  networkIn: number;      // MB/s
  networkOut: number;     // MB/s
  uptime: number;         // horas
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastUpdated: Date;
}

/** Métricas de resumen del sistema (SQL) */
export interface SummaryMetrics {
  totalServers: number;
  onlineServers: number;
  degradedServers: number;
  offlineServers: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  totalTickets: number;
  openTickets: number;
  criticalAlerts: number;
  uptimePercent: number;
}

/** Métricas en vivo para gráficos (NoSQL) */
export interface LiveMetrics {
  servers: ServerMetric[];
  chartLabels: string[];
  cpuData: number[];
  memoryData: number[];
  networkData: number[];
  timestamp: Date;
}

/** Dato de tendencia para MetricCard */
export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
}

/** KPI para el dashboard */
export interface KpiItem {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  trend: number;
  status: 'success' | 'warning' | 'danger';
  unit?: string;
}
