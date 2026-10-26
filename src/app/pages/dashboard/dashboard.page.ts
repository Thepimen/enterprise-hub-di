/**
 * @file dashboard.page.ts
 * @description Dashboard exclusivo ADMIN con KPIs, gráficos Chart.js y exportación.
 * Utiliza forkJoin para carga paralela de datos SQL + NoSQL.
 * Implementa dos gráficos Chart.js: barras (rendimiento) y doughnut (tickets).
 */
import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonMenuButton, IonButton, IonIcon, IonSpinner, IonGrid,
  IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, downloadOutline, documentTextOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  timerOutline, statsChartOutline, cloudDownloadOutline,
  menuOutline, trendingUpOutline
} from 'ionicons/icons';
import Chart from 'chart.js/auto';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { NoSqlMockService } from '../../core/services/nosql-mock.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { SummaryMetrics, KpiItem, LiveMetrics } from '../../core/models/metric.model';
import { Ticket } from '../../core/models/ticket.model';

addIcons({
  refreshOutline, downloadOutline, documentTextOutline, serverOutline,
  alertCircleOutline, checkmarkCircleOutline, timerOutline, statsChartOutline,
  cloudDownloadOutline, menuOutline, trendingUpOutline
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MetricCardComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonSpinner, IonGrid,
    IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <ion-icon name="stats-chart-outline" aria-hidden="true"></ion-icon>
            Dashboard
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="loadData()"
            [disabled]="isLoading"
            fill="clear"
            aria-label="Actualizar datos del dashboard"
            title="Actualizar"
          >
            <ion-icon name="refresh-outline" [class.spin]="isLoading" aria-hidden="true"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <!-- Pull-to-refresh accesible -->
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="dashboard-main" id="main-content" role="main">

        <!-- Loading skeleton -->
        <div *ngIf="isLoading" class="loading-overlay" role="status" aria-live="polite" aria-label="Cargando datos del dashboard">
          <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
          <p>Cargando infraestructura...</p>
        </div>

        <ng-container *ngIf="!isLoading">

          <!-- Cabecera de bienvenida -->
          <section class="dashboard-welcome" aria-label="Bienvenida">
            <div class="welcome-text">
              <h1 class="welcome-title">
                Bienvenido, {{ userName }}
                <span class="admin-badge" aria-label="Rol Administrador">ADMIN</span>
              </h1>
              <p class="welcome-sub">
                <ion-icon name="timer-outline" aria-hidden="true"></ion-icon>
                Última actualización: {{ lastUpdate | date:'HH:mm:ss' }}
              </p>
            </div>
            <div class="export-actions" role="group" aria-label="Acciones de exportación">
              <ion-button
                fill="outline"
                size="small"
                (click)="exportCsv()"
                [disabled]="isExporting"
                aria-label="Exportar datos a CSV"
              >
                <ion-icon name="download-outline" slot="start" aria-hidden="true"></ion-icon>
                CSV
              </ion-button>
              <ion-button
                fill="solid"
                size="small"
                (click)="exportPdf()"
                [disabled]="isExporting"
                aria-label="Exportar reporte a PDF"
              >
                <ion-icon name="document-text-outline" slot="start" aria-hidden="true"></ion-icon>
                PDF
              </ion-button>
            </div>
          </section>

          <!-- KPIs Grid -->
          <section class="kpis-section" aria-label="Indicadores clave de rendimiento">
            <h2 class="section-title sr-only">KPIs del Sistema</h2>
            <ion-grid class="kpi-grid">
              <ion-row>
                <ion-col size="12" size-sm="6" size-md="3" *ngFor="let kpi of kpis">
                  <app-metric-card
                    [title]="kpi.title"
                    [value]="kpi.value"
                    [icon]="kpi.icon"
                    [trend]="kpi.trend"
                    [status]="kpi.status"
                    [unit]="kpi.unit ?? ''"
                  ></app-metric-card>
                </ion-col>
              </ion-row>
            </ion-grid>
          </section>

          <!-- Gráficos Chart.js -->
          <section class="charts-section" aria-label="Gráficos de rendimiento">
            <h2 class="section-title">Análisis de Infraestructura</h2>
            <ion-grid>
              <ion-row>
                <!-- Gráfico de barras: Rendimiento de servidores -->
                <ion-col size="12" size-lg="7">
                  <ion-card class="chart-card" role="region" aria-label="Gráfico de rendimiento de servidores">
                    <ion-card-header>
                      <ion-card-title class="chart-title">
                        <ion-icon name="server-outline" aria-hidden="true"></ion-icon>
                        Rendimiento de Servidores (CPU & RAM)
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <div class="chart-wrapper">
                        <canvas
                          #barChart
                          role="img"
                          aria-label="Gráfico de barras mostrando CPU y uso de memoria por servidor"
                        ></canvas>
                      </div>
                    </ion-card-content>
                  </ion-card>
                </ion-col>

                <!-- Gráfico Doughnut: Distribución de tickets -->
                <ion-col size="12" size-lg="5">
                  <ion-card class="chart-card" role="region" aria-label="Distribución de tickets por estado">
                    <ion-card-header>
                      <ion-card-title class="chart-title">
                        <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
                        Distribución de Incidencias
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <div class="chart-wrapper doughnut-wrapper">
                        <canvas
                          #doughnutChart
                          role="img"
                          aria-label="Gráfico doughnut mostrando distribución de tickets por estado"
                        ></canvas>
                      </div>
                      <!-- Leyenda accesible -->
                      <div class="doughnut-legend" aria-label="Leyenda del gráfico de incidencias">
                        <div *ngFor="let item of ticketLegend" class="legend-item">
                          <span class="legend-dot" [style.background]="item.color" aria-hidden="true"></span>
                          <span>{{ item.label }}: <strong>{{ item.value }}</strong></span>
                        </div>
                      </div>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              </ion-row>
            </ion-grid>
          </section>

          <!-- Estado de servidores -->
          <section class="servers-section" aria-label="Estado de servidores en tiempo real">
            <h2 class="section-title">Estado en Tiempo Real</h2>
            <div class="server-grid">
              <div
                *ngFor="let server of topServers"
                class="server-item"
                [class]="'server-item--' + server.status.toLowerCase()"
                role="status"
                [attr.aria-label]="server.serverName + ': ' + server.status + ', CPU ' + server.cpuUsage + '%'"
              >
                <div class="server-name">{{ server.serverName }}</div>
                <div class="server-status">
                  <span class="status-indicator" [class]="'si--' + server.status.toLowerCase()" aria-hidden="true"></span>
                  {{ server.status }}
                </div>
                <div class="server-metrics">
                  <span>CPU: <strong>{{ server.cpuUsage }}%</strong></span>
                  <span>RAM: <strong>{{ server.memoryUsage }}%</strong></span>
                </div>
              </div>
            </div>
          </section>

        </ng-container>
      </main>
    </ion-content>
  `,
  styles: [`
    .dashboard-main { padding: 16px; }
    .loading-overlay {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 50vh; gap: 12px;
      color: var(--color-text-secondary);
    }
    .toolbar-title { display: flex; align-items: center; gap: 8px; font-weight: 700; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Bienvenida */
    .dashboard-welcome {
      display: flex; flex-wrap: wrap;
      align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 20px;
      padding: 16px 0;
    }
    .welcome-title {
      font-size: 1.4rem; font-weight: 800;
      color: var(--color-text-primary);
      margin: 0 0 4px;
      display: flex; align-items: center; gap: 8px;
    }
    .admin-badge {
      font-size: 0.6rem; font-weight: 700;
      background: var(--color-primary); color: white;
      padding: 2px 8px; border-radius: 20px;
      vertical-align: middle; letter-spacing: 0.05em;
    }
    .welcome-sub {
      font-size: 0.82rem; color: var(--color-text-secondary);
      display: flex; align-items: center; gap: 4px; margin: 0;
    }
    .export-actions { display: flex; gap: 8px; }

    /* KPIs */
    .kpis-section { margin-bottom: 8px; }
    .kpi-grid { padding: 0; }

    /* Section titles */
    .section-title {
      font-size: 1.1rem; font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 12px;
    }
    .section-title.sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
    .charts-section { margin: 16px 0; }
    .chart-card { border-radius: 16px !important; }
    .chart-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.95rem; font-weight: 700;
    }
    .chart-wrapper { position: relative; height: 280px; }
    .doughnut-wrapper { height: 220px; }
    .doughnut-legend {
      display: flex; flex-wrap: wrap; gap: 12px;
      justify-content: center; margin-top: 12px;
    }
    .legend-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: var(--color-text-secondary);
    }
    .legend-dot {
      width: 10px; height: 10px; border-radius: 50%;
      flex-shrink: 0;
    }

    /* Servidores */
    .servers-section { margin-top: 16px; }
    .server-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
    }
    .server-item {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px;
      border-left: 4px solid transparent;
    }
    .server-item--online   { border-left-color: #10b981; }
    .server-item--degraded { border-left-color: #f59e0b; }
    .server-item--offline  { border-left-color: #ef4444; }
    .server-name {
      font-size: 0.82rem; font-weight: 700;
      color: var(--color-text-primary); margin-bottom: 6px;
      font-family: monospace; letter-spacing: 0.02em;
    }
    .server-status {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; font-weight: 600;
      color: var(--color-text-secondary); margin-bottom: 8px;
    }
    .status-indicator {
      width: 7px; height: 7px; border-radius: 50%;
    }
    .si--online   { background: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
    .si--degraded { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
    .si--offline  { background: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.2); }
    .server-metrics {
      display: flex; gap: 10px;
      font-size: 0.75rem; color: var(--color-text-secondary);
    }
    .server-metrics strong { color: var(--color-text-primary); }
  `]
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly sqlService = inject(SqlMockService);
  private readonly noSqlService = inject(NoSqlMockService);
  private readonly exportService = inject(ExportService);
  private readonly authService = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();
  private barChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  isLoading = true;
  isExporting = false;
  lastUpdate = new Date();
  kpis: KpiItem[] = [];
  ticketLegend: { label: string; value: number; color: string }[] = [];
  topServers: ReturnType<NoSqlMockService['getCurrentSnapshot']>['servers'] = [];

  private allTickets: Ticket[] = [];
  private metrics!: SummaryMetrics;

  get userName(): string {
    return this.authService.currentUser?.name?.split(' ')[0] ?? 'Admin';
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializan tras recibir datos en loadData()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
  }

  /**
   * Carga datos en paralelo usando forkJoin.
   * Combina métricas SQL (relacionales) con métricas NoSQL (tiempo real).
   */
  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin([
      this.sqlService.getMetrics(),
      this.noSqlService.getTelemetry(),
      this.sqlService.getTickets(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([summary, live, tickets]) => {
          this.metrics = summary;
          this.allTickets = tickets;
          this.lastUpdate = new Date();
          this.topServers = live.servers.slice(0, 8);

          this.buildKpis(summary, tickets.length);
          this.buildTicketLegend(summary);

          this.isLoading = false;
          this.cdr.markForCheck();

          // Inicializar/actualizar gráficos tras render
          setTimeout(() => {
            this.initBarChart(live);
            this.initDoughnutChart(summary);
            this.cdr.markForCheck();
          }, 100);
        },
        error: () => {
          this.isLoading = false;
          this.notif.error('Error al cargar los datos del dashboard.');
          this.cdr.markForCheck();
        },
      });
  }

  onRefresh(event: CustomEvent): void {
    this.loadData();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1200);
  }

  exportCsv(): void {
    this.isExporting = true;
    this.notif.info('Generando CSV...');
    setTimeout(() => {
      this.exportService.exportTicketsToCsv(this.allTickets, 'dashboard-tickets');
      this.isExporting = false;
      this.notif.success('CSV descargado correctamente.');
      this.cdr.markForCheck();
    }, 300);
  }

  exportPdf(): void {
    this.isExporting = true;
    this.notif.info('Generando PDF profesional...');
    setTimeout(() => {
      this.exportService.exportDashboardToPdf(this.allTickets, this.metrics);
      this.isExporting = false;
      this.notif.success('PDF descargado correctamente.');
      this.cdr.markForCheck();
    }, 300);
  }

  private buildKpis(s: SummaryMetrics, totalTickets: number): void {
    this.kpis = [
      {
        id: 'servers', title: 'Servidores Online', value: `${s.onlineServers}/${s.totalServers}`,
        icon: 'server-outline', trend: 2, status: 'success',
      },
      {
        id: 'cpu', title: 'CPU Promedio', value: s.avgCpuUsage.toFixed(1),
        icon: 'stats-chart-outline', trend: -3, status: s.avgCpuUsage > 80 ? 'danger' : s.avgCpuUsage > 65 ? 'warning' : 'success',
        unit: '%',
      },
      {
        id: 'tickets', title: 'Tickets Abiertos', value: s.openTickets,
        icon: 'alert-circle-outline', trend: 5, status: s.openTickets > 5 ? 'danger' : 'warning',
      },
      {
        id: 'uptime', title: 'Uptime Sistema', value: `${s.uptimePercent}`,
        icon: 'checkmark-circle-outline', trend: 0, status: 'success', unit: '%',
      },
    ];
  }

  private buildTicketLegend(s: SummaryMetrics): void {
    this.ticketLegend = [
      { label: 'Abiertos',     value: s.openTickets - (s.totalTickets - s.openTickets - s.criticalAlerts > 0 ? 0 : 0), color: '#ef4444' },
      { label: 'En progreso',  value: s.openTickets > 3 ? 3 : 2, color: '#f59e0b' },
      { label: 'Resueltos',    value: Math.floor(s.totalTickets * 0.3), color: '#10b981' },
      { label: 'Cerrados',     value: Math.floor(s.totalTickets * 0.1), color: '#6b7280' },
    ];
  }

  private initBarChart(live: LiveMetrics): void {
    const canvas = this.barChartRef?.nativeElement;
    if (!canvas) return;

    this.barChart?.destroy();

    const labels = live.chartLabels.slice(0, 8);
    const cpuData = live.cpuData.slice(0, 8);
    const memData = live.memoryData.slice(0, 8);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'CPU (%)',
            data: cpuData,
            backgroundColor: 'rgba(25, 42, 86, 0.75)',
            borderColor: 'rgba(25, 42, 86, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'RAM (%)',
            data: memData,
            backgroundColor: 'rgba(6, 182, 212, 0.65)',
            borderColor: 'rgba(6, 182, 212, 1)',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (v) => `${v}%`, font: { family: 'Inter', size: 11 } },
            grid: { color: 'rgba(200,210,240,0.3)' },
          },
          x: {
            ticks: { font: { family: 'monospace', size: 9 }, maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
    });
  }

  private initDoughnutChart(s: SummaryMetrics): void {
    const canvas = this.doughnutChartRef?.nativeElement;
    if (!canvas) return;

    this.doughnutChart?.destroy();

    const openCount = this.allTickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = this.allTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolvedCount = this.allTickets.filter(t => t.status === 'RESOLVED').length;
    const closedCount = this.allTickets.filter(t => t.status === 'CLOSED').length;

    this.ticketLegend = [
      { label: 'Abiertos',     value: openCount,      color: '#ef4444' },
      { label: 'En progreso',  value: inProgressCount, color: '#f59e0b' },
      { label: 'Resueltos',    value: resolvedCount,   color: '#10b981' },
      { label: 'Cerrados',     value: closedCount,     color: '#6b7280' },
    ];

    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Abiertos', 'En progreso', 'Resueltos', 'Cerrados'],
        datasets: [
          {
            data: [openCount, inProgressCount, resolvedCount, closedCount],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'],
            borderColor: ['#dc2626', '#d97706', '#059669', '#4b5563'],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw} tickets`,
            },
          },
        },
      },
    });
    this.cdr.markForCheck();
  }
}
