/**
 * @file dashboard.page.ts
 * @description Dashboard de operaciones e infraestructura empresarial.
 * Refactorizado según las directrices de diseño Taste Skill:
 * - Eliminación total de gráficos de barras en favor de gráficos de telemetría de líneas de alta precisión
 * - Paleta sin degradados estridentes, tipografía sobria con cifras tabulares
 * - Anillo geométrico refinado para incidencias y KPIs tipográficos
 * - Carga concurrente con forkJoin (SQL relacional + NoSQL telemetría) y exportación PDF/CSV
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
  IonMenuButton, IonButton, IonIcon, IonSpinner,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, downloadOutline, documentTextOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  timerOutline, statsChartOutline, cloudDownloadOutline,
  menuOutline, trendingUpOutline, pulseOutline, hardwareChipOutline
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
  cloudDownloadOutline, menuOutline, trendingUpOutline, pulseOutline, hardwareChipOutline
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MetricCardComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar class="app-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <span class="toolbar-brand-dot"></span>
            Consola Operativa
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="loadData()"
            [disabled]="isLoading"
            fill="clear"
            aria-label="Actualizar datos del dashboard"
            title="Sincronizar telemetría"
            class="header-refresh-btn"
          >
            <ion-icon name="refresh-outline" [class.spin]="isLoading" aria-hidden="true"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="dashboard-main" id="main-content" role="main">

        <!-- Loading skeleton -->
        <div *ngIf="isLoading" class="loading-overlay" role="status" aria-live="polite" aria-label="Cargando datos del dashboard">
          <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
          <p class="loading-text">Sincronizando telemetría de clústeres...</p>
        </div>

        <ng-container *ngIf="!isLoading">

          <!-- Cabecera de consola operativa (Anti-slop: informativa, sin saludos vacíos) -->
          <header class="dashboard-header" aria-label="Resumen operativo">
            <div class="header-identity">
              <div class="header-breadcrumbs">
                <span class="bc-root">Infraestructura</span>
                <span class="bc-sep">/</span>
                <span class="bc-current">Supervisión en vivo</span>
              </div>
              <h1 class="header-title">Monitor de Clúster & Operaciones</h1>
              <p class="header-subtitle">
                <span class="live-indicator">
                  <span class="live-dot" aria-hidden="true"></span>
                  Conexión activa
                </span>
                <span class="meta-sep">•</span>
                <span class="meta-time">Último paquete: {{ lastUpdate | date:'HH:mm:ss' }}</span>
                <span class="meta-sep">•</span>
                <span class="meta-user">Operador: {{ userName }}</span>
              </p>
            </div>

            <div class="header-actions" role="group" aria-label="Acciones de exportación">
              <button
                class="action-btn"
                (click)="exportCsv()"
                [disabled]="isExporting"
                aria-label="Exportar datos a CSV"
                title="Descargar datos en formato CSV"
              >
                <ion-icon name="download-outline" aria-hidden="true"></ion-icon>
                <span>CSV</span>
              </button>
              <button
                class="action-btn action-btn--primary"
                (click)="exportPdf()"
                [disabled]="isExporting"
                aria-label="Exportar reporte a PDF"
                title="Generar informe en PDF"
              >
                <ion-icon name="document-text-outline" aria-hidden="true"></ion-icon>
                <span>Informe PDF</span>
              </button>
            </div>
          </header>

          <!-- KPIs Grid (Taste Skill: tipografía, datos tabulares, sin cajas con iconos de colores) -->
          <section class="kpis-section" aria-label="Indicadores clave de rendimiento">
            <h2 class="section-heading sr-only">KPIs de Rendimiento</h2>
            <div class="kpi-grid">
              <app-metric-card
                *ngFor="let kpi of kpis"
                [title]="kpi.title"
                [value]="kpi.value"
                [icon]="kpi.icon"
                [trend]="kpi.trend"
                [status]="kpi.status"
                [unit]="kpi.unit ?? ''"
              ></app-metric-card>
            </div>
          </section>

          <!-- Gráficos de alta fidelidad (Sin gráficos de barras - Telemetría continua) -->
          <section class="charts-section" aria-label="Gráficos de telemetría e incidencias">
            <div class="charts-grid">

              <!-- Gráfico de Telemetría: Líneas continuas temporales CPU & Memoria -->
              <article class="chart-panel chart-panel--telemetry" role="region" aria-label="Telemetría de servidores">
                <header class="chart-panel__header">
                  <div>
                    <h2 class="chart-panel__title">Carga de Cómputo en Tiempo Real</h2>
                    <p class="chart-panel__subtitle">Consumo de CPU y Memoria RAM en nodos activos</p>
                  </div>
                  <div class="chart-legend" aria-hidden="true">
                    <span class="chart-legend__item">
                      <span class="legend-line legend-line--cpu"></span>
                      CPU (%)
                    </span>
                    <span class="chart-legend__item">
                      <span class="legend-line legend-line--mem"></span>
                      RAM (%)
                    </span>
                  </div>
                </header>
                <div class="chart-canvas-wrapper">
                  <canvas
                    #telemetryChart
                    role="img"
                    aria-label="Gráfico de líneas continuas que muestra la evolución de CPU y memoria en servidores"
                  ></canvas>
                </div>
              </article>

              <!-- Gráfico Anillo de Incidencias: Distribución limpia -->
              <article class="chart-panel chart-panel--incidents" role="region" aria-label="Distribución de incidencias">
                <header class="chart-panel__header">
                  <div>
                    <h2 class="chart-panel__title">Distribución de Incidencias</h2>
                    <p class="chart-panel__subtitle">Estado de tickets en la ventana activa</p>
                  </div>
                </header>
                <div class="doughnut-container">
                  <div class="doughnut-canvas-wrapper">
                    <canvas
                      #doughnutChart
                      role="img"
                      aria-label="Gráfico de anillo de distribución de tickets por estado"
                    ></canvas>
                  </div>
                  <div class="doughnut-legend-list" aria-label="Desglose por estado de ticket">
                    <div *ngFor="let item of ticketLegend" class="doughnut-legend-row">
                      <div class="legend-label-col">
                        <span class="legend-chip" [style.background-color]="item.color" aria-hidden="true"></span>
                        <span class="legend-name">{{ item.label }}</span>
                      </div>
                      <span class="legend-count">{{ item.value }}</span>
                    </div>
                  </div>
                </div>
              </article>

            </div>
          </section>

          <!-- Estado de nodos y servidores en tiempo real -->
          <section class="servers-section" aria-label="Nodos de infraestructura en producción">
            <div class="section-header-row">
              <div>
                <h2 class="section-heading">Nodos de Infraestructura</h2>
                <p class="section-subheading">Estado operativo y métricas por instancia de servidor</p>
              </div>
              <span class="server-count-badge">{{ topServers.length }} nodos monitorizados</span>
            </div>

            <div class="server-grid">
              <div
                *ngFor="let server of topServers"
                class="server-card"
                role="status"
                [attr.aria-label]="server.serverName + ': estado ' + server.status + ', CPU al ' + server.cpuUsage + '%, RAM al ' + server.memoryUsage + '%'"
              >
                <div class="server-card__top">
                  <span class="server-hostname">{{ server.serverName }}</span>
                  <span class="server-status-pill" [class]="'pill--' + server.status.toLowerCase()">
                    <span class="status-pip" aria-hidden="true"></span>
                    {{ server.status }}
                  </span>
                </div>

                <div class="server-card__metrics">
                  <div class="metric-meter">
                    <div class="metric-meter__header">
                      <span>CPU</span>
                      <strong>{{ server.cpuUsage }}%</strong>
                    </div>
                    <div class="metric-meter__track">
                      <div
                        class="metric-meter__fill"
                        [class.fill--warn]="server.cpuUsage > 75"
                        [class.fill--danger]="server.cpuUsage > 90"
                        [style.width.%]="server.cpuUsage"
                      ></div>
                    </div>
                  </div>

                  <div class="metric-meter">
                    <div class="metric-meter__header">
                      <span>RAM</span>
                      <strong>{{ server.memoryUsage }}%</strong>
                    </div>
                    <div class="metric-meter__track">
                      <div
                        class="metric-meter__fill metric-meter__fill--mem"
                        [class.fill--warn]="server.memoryUsage > 80"
                        [class.fill--danger]="server.memoryUsage > 92"
                        [style.width.%]="server.memoryUsage"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </ng-container>
      </main>
    </ion-content>
  `,
  styles: [`
    .app-toolbar {
      --background: var(--surface-card);
      --border-color: var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .toolbar-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      letter-spacing: -0.01em;
    }
    .toolbar-brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-accent);
    }
    .header-refresh-btn {
      --color: var(--color-text-secondary);
    }
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .dashboard-main {
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 45vh;
      gap: 12px;
      color: var(--color-text-secondary);
    }
    .loading-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Cabecera Operativa */
    .dashboard-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 24px;
    }
    .header-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }
    .bc-sep { color: var(--color-text-disabled); }
    .bc-current { color: var(--color-text-primary); font-weight: 500; }
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
      margin: 0 0 6px;
    }
    .header-subtitle {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #059669;
      font-weight: 500;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #059669;
    }
    .meta-sep { color: var(--color-text-disabled); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
      background: var(--surface-card);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover:not(:disabled) {
      background: var(--color-hover);
      border-color: var(--color-text-disabled);
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .action-btn--primary {
      background: var(--color-primary);
      color: #ffffff;
      border-color: var(--color-primary);
    }
    .action-btn--primary:hover:not(:disabled) {
      background: #0f1d3b;
      border-color: #0f1d3b;
      color: #ffffff;
    }

    /* KPIs Grid */
    .kpis-section { margin-bottom: 24px; }
    .section-heading.sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0,0,0,0); border: 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    /* Paneles de Gráficos */
    .charts-section { margin-bottom: 32px; }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }
    @media (min-width: 992px) {
      .charts-grid {
        grid-template-columns: 1.6fr 1fr;
      }
    }

    .chart-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .chart-panel__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .chart-panel__title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 2px;
      letter-spacing: -0.01em;
    }
    .chart-panel__subtitle {
      font-size: 0.78125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chart-legend__item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .legend-line {
      width: 14px;
      height: 3px;
      border-radius: 2px;
    }
    .legend-line--cpu { background: #0f172a; }
    .legend-line--mem { background: #2563eb; }

    .chart-canvas-wrapper {
      position: relative;
      height: 270px;
      width: 100%;
    }

    /* Anillo de incidencias */
    .doughnut-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    @media (min-width: 540px) {
      .doughnut-container {
        flex-direction: row;
        gap: 20px;
      }
    }
    .doughnut-canvas-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
      flex-shrink: 0;
    }
    .doughnut-legend-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 200px;
    }
    .doughnut-legend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;
      padding: 4px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .doughnut-legend-row:last-child { border-bottom: none; }
    .legend-label-col {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .legend-chip {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .legend-name {
      color: var(--color-text-secondary);
    }
    .legend-count {
      font-weight: 600;
      color: var(--color-text-primary);
      font-variant-numeric: tabular-nums;
    }

    /* Servidores */
    .servers-section { margin-top: 8px; }
    .section-header-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 12px;
    }
    .section-heading {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 2px;
      letter-spacing: -0.01em;
    }
    .section-subheading {
      font-size: 0.78125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .server-count-badge {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      background: var(--surface-ground);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
    }

    .server-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .server-card {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s ease;
    }
    .server-card:hover {
      border-color: var(--color-text-disabled);
    }
    .server-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .server-hostname {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .server-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-pip {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }
    .pill--online {
      background: rgba(5, 150, 105, 0.08);
      color: #059669;
      border: 1px solid rgba(5, 150, 105, 0.2);
    }
    .pill--online .status-pip { background: #059669; }
    .pill--degraded {
      background: rgba(217, 119, 6, 0.08);
      color: #d97706;
      border: 1px solid rgba(217, 119, 6, 0.2);
    }
    .pill--degraded .status-pip { background: #d97706; }
    .pill--offline {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .pill--offline .status-pip { background: #dc2626; }

    .server-card__metrics {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .metric-meter__header {
      display: flex;
      justify-content: space-between;
      font-size: 0.71875rem;
      color: var(--color-text-secondary);
      margin-bottom: 3px;
    }
    .metric-meter__header strong {
      color: var(--color-text-primary);
      font-variant-numeric: tabular-nums;
    }
    .metric-meter__track {
      height: 5px;
      background: var(--surface-ground);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid var(--color-border);
    }
    .metric-meter__fill {
      height: 100%;
      background: #0f172a;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .metric-meter__fill--mem { background: #2563eb; }
    .fill--warn { background: #d97706 !important; }
    .fill--danger { background: #dc2626 !important; }
  `]
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('telemetryChart') telemetryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly sqlService = inject(SqlMockService);
  private readonly noSqlService = inject(NoSqlMockService);
  private readonly exportService = inject(ExportService);
  private readonly authService = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();
  private telemetryChart: Chart | null = null;
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
    this.telemetryChart?.destroy();
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

          // Inicializar gráfico continuo de telemetría y anillo de incidencias
          setTimeout(() => {
            this.initTelemetryLineChart(live);
            this.initDoughnutChart(summary);
            this.cdr.markForCheck();
          }, 100);
        },
        error: () => {
          this.isLoading = false;
          this.notif.error('Error al sincronizar datos del clúster.');
          this.cdr.markForCheck();
        },
      });
  }

  onRefresh(event: CustomEvent): void {
    this.loadData();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 1000);
  }

  exportCsv(): void {
    this.isExporting = true;
    this.notif.info('Generando archivo CSV...');
    setTimeout(() => {
      this.exportService.exportTicketsToCsv(this.allTickets, 'dashboard-tickets');
      this.isExporting = false;
      this.notif.success('Archivo CSV descargado correctamente.');
      this.cdr.markForCheck();
    }, 300);
  }

  exportPdf(): void {
    this.isExporting = true;
    this.notif.info('Generando informe ejecutivo PDF...');
    setTimeout(() => {
      this.exportService.exportDashboardToPdf(this.allTickets, this.metrics);
      this.isExporting = false;
      this.notif.success('Informe PDF descargado correctamente.');
      this.cdr.markForCheck();
    }, 300);
  }

  private buildKpis(s: SummaryMetrics, totalTickets: number): void {
    this.kpis = [
      {
        id: 'servers',
        title: 'Nodos en Línea',
        value: `${s.onlineServers} / ${s.totalServers}`,
        icon: 'server-outline',
        trend: 2,
        status: 'success',
      },
      {
        id: 'cpu',
        title: 'Carga Media CPU',
        value: s.avgCpuUsage.toFixed(1),
        icon: 'pulse-outline',
        trend: -3,
        status: s.avgCpuUsage > 80 ? 'danger' : s.avgCpuUsage > 65 ? 'warning' : 'success',
        unit: '%',
      },
      {
        id: 'tickets',
        title: 'Incidencias Abiertas',
        value: s.openTickets,
        icon: 'alert-circle-outline',
        trend: 5,
        status: s.openTickets > 5 ? 'danger' : 'warning',
      },
      {
        id: 'uptime',
        title: 'Disponibilidad Clúster',
        value: `${s.uptimePercent}`,
        icon: 'checkmark-circle-outline',
        trend: 0,
        status: 'success',
        unit: '%',
      },
    ];
  }

  private buildTicketLegend(s: SummaryMetrics): void {
    const openCount = this.allTickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = this.allTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolvedCount = this.allTickets.filter(t => t.status === 'RESOLVED').length;
    const closedCount = this.allTickets.filter(t => t.status === 'CLOSED').length;

    this.ticketLegend = [
      { label: 'Abiertas',     value: openCount,       color: '#dc2626' },
      { label: 'En progreso',  value: inProgressCount, color: '#d97706' },
      { label: 'Resueltas',    value: resolvedCount,   color: '#059669' },
      { label: 'Cerradas',     value: closedCount,     color: '#64748b' },
    ];
  }

  /**
   * Inicializa el gráfico continuo de telemetría (Taste Skill: sustituye barras genéricas).
   * Línea de alta precisión con marcas discretas y cuadrícula tenue.
   */
  private initTelemetryLineChart(live: LiveMetrics): void {
    const canvas = this.telemetryChartRef?.nativeElement;
    if (!canvas) return;

    this.telemetryChart?.destroy();

    const labels = live.chartLabels.slice(0, 8);
    const cpuData = live.cpuData.slice(0, 8);
    const memData = live.memoryData.slice(0, 8);

    this.telemetryChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'CPU (%)',
            data: cpuData,
            borderColor: '#0f172a',
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
            borderWidth: 2,
            tension: 0.25,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#0f172a',
          },
          {
            label: 'RAM (%)',
            data: memData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderWidth: 1.8,
            tension: 0.25,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#2563eb',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 11, weight: 'bold' },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 25,
              callback: (v) => `${v}%`,
              font: { size: 11, family: 'Inter' },
              color: '#64748b',
            },
            grid: {
              color: 'rgba(226, 232, 240, 0.7)',
            },
            border: { display: false },
          },
          x: {
            ticks: {
              font: { size: 10, family: 'monospace' },
              color: '#64748b',
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }

  /**
   * Inicializa el anillo geométrico de incidencias (cutout 74%).
   */
  private initDoughnutChart(s: SummaryMetrics): void {
    const canvas = this.doughnutChartRef?.nativeElement;
    if (!canvas) return;

    this.doughnutChart?.destroy();

    const openCount = this.allTickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = this.allTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolvedCount = this.allTickets.filter(t => t.status === 'RESOLVED').length;
    const closedCount = this.allTickets.filter(t => t.status === 'CLOSED').length;

    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Abiertas', 'En progreso', 'Resueltas', 'Cerradas'],
        datasets: [
          {
            data: [openCount, inProgressCount, resolvedCount, closedCount],
            backgroundColor: ['#dc2626', '#d97706', '#059669', '#64748b'],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} tickets`,
            },
          },
        },
      },
    });
    this.cdr.markForCheck();
  }
}
