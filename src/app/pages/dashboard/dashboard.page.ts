/**
 * @file dashboard.page.ts
 * @description Consola de Administración e Infraestructura Empresarial (Admin / Dashboard).
 * Protegida mediante [authGuard, roleGuard('admin')].
 * - Integra verificación visual del Signal authService.currentUser() y botón logout()
 * - Menú lateral desplegable (overlay drawer) + selector desplegable en barra superior
 * - Botones de alto contraste garantizado (sin colisiones blanco-sobre-blanco en modo oscuro)
 * - Telemetría continua de líneas (CPU #10b981 y RAM #3b82f6) y anillo geométrico de incidencias
 */
import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, ChangeDetectionStrategy,
  ChangeDetectorRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonMenuButton, IonButton, IonIcon, IonSpinner,
  IonRefresher, IonRefresherContent, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, downloadOutline, documentTextOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  timerOutline, statsChartOutline, cloudDownloadOutline,
  menuOutline, trendingUpOutline, pulseOutline, hardwareChipOutline,
  shieldCheckmarkOutline, logOutOutline, chevronDownOutline,
  ticketOutline, bookOutline, personCircleOutline
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
  cloudDownloadOutline, menuOutline, trendingUpOutline, pulseOutline,
  hardwareChipOutline, shieldCheckmarkOutline, logOutOutline,
  chevronDownOutline, ticketOutline, bookOutline, personCircleOutline
});

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, MetricCardComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar class="app-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" aria-label="Abrir menú lateral desplegable"></ion-menu-button>
          <button
            type="button"
            class="menu-trigger-btn"
            (click)="toggleDrawer()"
            aria-label="Desplegar menú de navegación"
          >
            <ion-icon name="menu-outline" aria-hidden="true"></ion-icon>
            <span>Menú</span>
          </button>
        </ion-buttons>

        <ion-title>
          <span class="toolbar-title">
            <span class="toolbar-brand-dot"></span>
            Consola de Administración · RBAC Admin
          </span>
        </ion-title>

        <ion-buttons slot="end">
          <!-- Menú Desplegable de Usuario y Vistas en Cabecera -->
          <div class="header-dropdown-wrap">
            <button
              type="button"
              class="dropdown-toggle-btn"
              (click)="toggleDropdown()"
              [attr.aria-expanded]="dropdownOpen()"
            >
              <span class="user-chip-avatar">{{ (authService.currentUser()?.username || 'AD').slice(0, 2).toUpperCase() }}</span>
              <span class="user-chip-name">{{ authService.currentUser()?.username || 'admin' }}</span>
              <span class="user-chip-role">{{ authService.currentUser()?.role || 'admin' }}</span>
              <ion-icon name="chevron-down-outline"></ion-icon>
            </button>

            <div class="header-dropdown-menu" *ngIf="dropdownOpen()">
              <div class="dropdown-header">
                <strong>{{ authService.currentUser()?.username }}</strong>
                <span>Sesión activa · Rol: {{ authService.currentUser()?.role }}</span>
              </div>
              <a routerLink="/admin" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <span>Consola Admin (/admin)</span>
              </a>
              <a routerLink="/tickets" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="ticket-outline"></ion-icon>
                <span>Gestión de Tickets (/tickets)</span>
              </a>
              <a routerLink="/help" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="book-outline"></ion-icon>
                <span>Documentación (/help)</span>
              </a>
              <div class="dropdown-divider"></div>
              <button type="button" (click)="onLogout()" class="dropdown-item dropdown-item--danger">
                <ion-icon name="log-out-outline"></ion-icon>
                <span>Cerrar Sesión (logout)</span>
              </button>
            </div>
          </div>

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

          <button
            type="button"
            id="btn-admin-logout"
            class="toolbar-logout-btn"
            (click)="onLogout()"
            aria-label="Cerrar sesión de administrador"
          >
            <ion-icon name="log-out-outline" aria-hidden="true"></ion-icon>
            <span>Cerrar Sesión</span>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="dashboard-main" id="main-content" role="main">

        <!-- Banner de Verificación RBAC & Signals (Requisito 3.3 del Laboratorio) -->
        <section class="rbac-verification-banner" aria-label="Estado de sesión y control de acceso RBAC">
          <div class="rbac-info-left">
            <div class="rbac-shield-icon" aria-hidden="true">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
            </div>
            <div class="rbac-details">
              <div class="rbac-pills-row">
                <span class="guard-tag">canActivate: [authGuard, roleGuard('admin')]</span>
                <span class="role-tag">ROL: {{ (authService.currentUser()?.role || 'admin') | uppercase }}</span>
                <span class="storage-tag">sessionStorage['DAM2_AUTH_SESSION']</span>
              </div>
              <p class="rbac-summary">
                Sesión autenticada con <strong>Angular Signals</strong>:
                Usuario <code>{{ authService.currentUser()?.username }}</code> ·
                <code>isAuthenticated() = {{ authService.isAuthenticated() }}</code>
              </p>
            </div>
          </div>
          <div class="rbac-actions-right">
            <a routerLink="/tickets" class="action-btn">
              <ion-icon name="ticket-outline"></ion-icon>
              <span>Tickets</span>
            </a>
            <button type="button" class="action-btn action-btn--danger" (click)="onLogout()">
              <ion-icon name="log-out-outline"></ion-icon>
              <span>Logout</span>
            </button>
          </div>
        </section>

        <!-- Loading skeleton -->
        <div *ngIf="isLoading" class="loading-overlay" role="status" aria-live="polite" aria-label="Cargando datos del dashboard">
          <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
          <p class="loading-text">Sincronizando telemetría de clústeres...</p>
        </div>

        <ng-container *ngIf="!isLoading">

          <!-- Cabecera de consola operativa -->
          <header class="dashboard-header" aria-label="Resumen operativo">
            <div class="header-identity">
              <div class="header-breadcrumbs">
                <span class="bc-root">Infraestructura</span>
                <span class="bc-sep">/</span>
                <span class="bc-current">Supervisión en vivo</span>
              </div>
              <h1 class="header-title">Monitor de Clúster &amp; Operaciones</h1>
              <p class="header-subtitle">
                <span class="live-indicator">
                  <span class="live-dot" aria-hidden="true"></span>
                  Conexión activa
                </span>
                <span class="meta-sep">•</span>
                <span class="meta-time">Último paquete: {{ lastUpdate | date:'HH:mm:ss' }}</span>
                <span class="meta-sep">•</span>
                <span class="meta-user">Operador en sesión: <strong>{{ userName }}</strong> ({{ authService.currentUser()?.role }})</span>
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
                <span>Exportar CSV</span>
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

          <!-- KPIs Grid -->
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

          <!-- Gráficos de alta fidelidad (Telemetría de líneas de alto contraste) -->
          <section class="charts-section" aria-label="Gráficos de telemetría e incidencias">
            <div class="charts-grid">

              <!-- Gráfico de Telemetría: Líneas continuas CPU & Memoria -->
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

              <!-- Gráfico Anillo de Incidencias -->
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
      padding: 0 8px;
    }
    .menu-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: 6px;
      border: 1px solid var(--btn-secondary-border);
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      margin-left: 4px;
    }
    .menu-trigger-btn:hover {
      background: var(--btn-secondary-bg-hover);
    }

    .toolbar-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.01em;
    }
    .toolbar-brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
    }

    /* Dropdown en cabecera */
    .header-dropdown-wrap {
      position: relative;
      margin-right: 4px;
    }
    .dropdown-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 34px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid var(--color-border-strong);
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .user-chip-avatar {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: #2563eb;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .user-chip-role {
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .header-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      width: 250px;
      background: var(--surface-card);
      border: 1px solid var(--color-border-strong);
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      padding: 6px;
      z-index: 999;
    }
    .dropdown-header {
      padding: 8px 10px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 4px;
      display: flex;
      flex-direction: column;
      font-size: 0.78rem;
      color: var(--color-text-primary);
    }
    .dropdown-header span {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
    }
    .dropdown-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-text-primary);
      text-decoration: none;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .dropdown-item:hover {
      background: var(--surface-elevated);
    }
    .dropdown-item--danger {
      color: #ef4444;
    }
    .dropdown-divider {
      height: 1px;
      background: var(--color-border);
      margin: 4px 0;
    }

    .header-refresh-btn {
      --color: var(--color-text-secondary);
    }
    .toolbar-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      margin-left: 4px;
    }
    .toolbar-logout-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .dashboard-main {
      max-width: 1360px;
      margin: 0 auto;
      padding: 20px 20px 48px;
    }

    /* Banner de Verificación RBAC & Signals */
    .rbac-verification-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
      padding: 14px 18px;
      margin-bottom: 22px;
      border-radius: 10px;
      background: var(--surface-card);
      border: 1px solid var(--badge-admin-border);
      border-left: 4px solid #2563eb;
    }
    .rbac-info-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .rbac-shield-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }
    .rbac-pills-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .guard-tag {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .role-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: #2563eb;
      color: #ffffff;
    }
    .storage-tag {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .rbac-summary {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }
    .rbac-summary code {
      font-family: var(--font-mono);
      color: var(--color-text-primary);
      background: var(--surface-elevated);
      padding: 1px 5px;
      border-radius: 4px;
    }
    .rbac-actions-right {
      display: flex;
      align-items: center;
      gap: 8px;
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
      color: #10b981;
      font-weight: 600;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }
    .meta-sep { color: var(--color-text-disabled); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Botones con contraste garantizado en Modo Claro y Modo Oscuro */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      border: 1px solid var(--btn-secondary-border);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover:not(:disabled) {
      background: var(--btn-secondary-bg-hover);
    }
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .action-btn--primary {
      background: var(--btn-primary-bg) !important;
      color: var(--btn-primary-text) !important;
      border-color: var(--btn-primary-border) !important;
    }
    .action-btn--primary:hover:not(:disabled) {
      background: var(--btn-primary-bg-hover) !important;
      color: #ffffff !important;
    }
    .action-btn--danger {
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.4);
    }
    .action-btn--danger:hover {
      background: #ef4444;
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
      border-radius: 10px;
      padding: 20px;
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
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .chart-legend {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-shrink: 0;
    }
    .chart-legend__item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .legend-line {
      width: 14px;
      height: 3px;
      border-radius: 2px;
    }
    .legend-line--cpu { background: #10b981; }
    .legend-line--mem { background: #3b82f6; }

    .chart-canvas-wrapper {
      position: relative;
      height: 270px;
    }

    /* Doughnut layout */
    .doughnut-container {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      padding-top: 8px;
    }
    .doughnut-canvas-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
      margin: 0 auto;
      flex-shrink: 0;
    }
    .doughnut-legend-list {
      flex: 1;
      min-width: 150px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .doughnut-legend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.8125rem;
    }
    .doughnut-legend-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .legend-label-col {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-chip {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-name {
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .legend-count {
      font-weight: 600;
      color: var(--color-text-primary);
      font-variant-numeric: tabular-nums;
    }

    /* Nodos de Infraestructura */
    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-heading {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 2px;
      letter-spacing: -0.01em;
    }
    .section-subheading {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .server-count-badge {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      padding: 4px 10px;
      border-radius: 6px;
      font-variant-numeric: tabular-nums;
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
    }
    .server-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
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
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    .status-pip {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }
    .pill--online {
      background: rgba(16, 185, 129, 0.14);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }
    .pill--degraded {
      background: rgba(245, 158, 11, 0.14);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .pill--offline {
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .server-card__metrics {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .metric-meter {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .metric-meter__header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .metric-meter__header strong {
      color: var(--color-text-primary);
      font-weight: 600;
    }
    .metric-meter__track {
      height: 5px;
      background: var(--surface-elevated);
      border-radius: 3px;
      overflow: hidden;
    }
    .metric-meter__fill {
      height: 100%;
      background: #10b981;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .metric-meter__fill--mem { background: #3b82f6; }
    .fill--warn { background: #f59e0b !important; }
    .fill--danger { background: #ef4444 !important; }
  `]
})
export class DashboardPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('telemetryChart') telemetryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly sqlService = inject(SqlMockService);
  private readonly noSqlService = inject(NoSqlMockService);
  private readonly exportService = inject(ExportService);
  readonly authService = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);

  private readonly destroy$ = new Subject<void>();
  private telemetryChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  readonly dropdownOpen = signal(false);

  isLoading = true;
  isExporting = false;
  lastUpdate = new Date();
  kpis: KpiItem[] = [];
  ticketLegend: { label: string; value: number; color: string }[] = [];
  topServers: ReturnType<NoSqlMockService['getCurrentSnapshot']>['servers'] = [];

  private allTickets: Ticket[] = [];
  private metrics!: SummaryMetrics;

  get userName(): string {
    return this.authService.currentUser()?.username ?? 'admin';
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

  async toggleDrawer(): Promise<void> {
    await this.menuCtrl.toggle('main-menu');
  }

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  onLogout(): void {
    this.dropdownOpen.set(false);
    this.authService.logout();
    this.notif.info('Sesión de administrador finalizada.');
  }

  /**
   * Carga datos en paralelo usando forkJoin.
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

  private buildKpis(s: SummaryMetrics, _totalTickets: number): void {
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

  private buildTicketLegend(_s: SummaryMetrics): void {
    const openCount = this.allTickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = this.allTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolvedCount = this.allTickets.filter(t => t.status === 'RESOLVED').length;
    const closedCount = this.allTickets.filter(t => t.status === 'CLOSED').length;

    this.ticketLegend = [
      { label: 'Abiertas',     value: openCount,       color: '#ef4444' },
      { label: 'En progreso',  value: inProgressCount, color: '#f59e0b' },
      { label: 'Resueltas',    value: resolvedCount,   color: '#10b981' },
      { label: 'Cerradas',     value: closedCount,     color: '#64748b' },
    ];
  }

  /**
   * Inicializa el gráfico continuo de telemetría con colores de alto contraste (#10b981 y #3b82f6)
   * visibles tanto en modo claro como en modo oscuro.
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
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          },
          {
            label: 'RAM (%)',
            data: memData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
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
              color: '#94a3b8',
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.18)',
            },
            border: { display: false },
          },
          x: {
            ticks: {
              font: { size: 10, family: 'monospace' },
              color: '#94a3b8',
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
  private initDoughnutChart(_s: SummaryMetrics): void {
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
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#64748b'],
            borderColor: 'rgba(15, 23, 42, 0.25)',
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
