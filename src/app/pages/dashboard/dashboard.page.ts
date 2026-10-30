/**
 * @file dashboard.page.ts
 * @description NOC & RBAC Command Center (/admin y /dashboard).
 * Diseño asimétrico Bento de alta densidad radicalmente diferenciado de plantillas genéricas:
 * - Botón único de menú desplegable lateral (eliminado el doble botón superior izquierdo)
 * - Popover de sesión flotante renderizado fuera de <ion-header> (sin recorte por Shadow DOM)
 * - Paleta de Comandos Rápida (⌘K) y Conmutador en vivo de Tema Claro/Oscuro
 * - Cockpit de Telemetría con selector interactivo de series (CPU+RAM, Solo CPU, Solo RAM, IOPS)
 * - Topología de Nodos tipo Rack Blade con botón de diagnóstico interactivo en tiempo real
 * - Terminal SRE en vivo conectada al Signal authService.auditLogs()
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
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonIcon, IonSkeletonText, IonRefresher, IonRefresherContent, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, downloadOutline, documentTextOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  timerOutline, statsChartOutline, cloudDownloadOutline,
  menuOutline, trendingUpOutline, pulseOutline, hardwareChipOutline,
  shieldCheckmarkOutline, logOutOutline, chevronDownOutline,
  ticketOutline, bookOutline, personCircleOutline, sunnyOutline,
  moonOutline, searchOutline, terminalOutline, flashOutline,
  globeOutline, logoGithub, closeOutline, radioButtonOnOutline
} from 'ionicons/icons';
import Chart from 'chart.js/auto';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { NoSqlMockService } from '../../core/services/nosql-mock.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SummaryMetrics, KpiItem, LiveMetrics } from '../../core/models/metric.model';
import { Ticket } from '../../core/models/ticket.model';

addIcons({
  refreshOutline, downloadOutline, documentTextOutline, serverOutline,
  alertCircleOutline, checkmarkCircleOutline, timerOutline, statsChartOutline,
  cloudDownloadOutline, menuOutline, trendingUpOutline, pulseOutline,
  hardwareChipOutline, shieldCheckmarkOutline, logOutOutline,
  chevronDownOutline, ticketOutline, bookOutline, personCircleOutline,
  sunnyOutline, moonOutline, searchOutline, terminalOutline, flashOutline,
  globeOutline, logoGithub, closeOutline, radioButtonOnOutline
});

type TelemetryMode = 'combined' | 'cpu' | 'ram' | 'iops';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonButtons,
    IonIcon, IonSkeletonText, IonRefresher, IonRefresherContent,
  ],
  template: `
    <!-- CABECERA NOC CON UN ÚNICO BOTÓN DE MENÚ A LA IZQUIERDA -->
    <ion-header [translucent]="true" class="ion-no-border">
      <ion-toolbar class="noc-toolbar">
        <ion-buttons slot="start">
          <button
            type="button"
            id="btn-single-menu"
            class="single-menu-btn"
            (click)="toggleDrawer()"
            aria-label="Abrir menú lateral desplegable"
          >
            <ion-icon name="menu-outline" aria-hidden="true"></ion-icon>
            <span>Navegación</span>
          </button>

          <div class="noc-brand-title">
            <span class="noc-live-pip"></span>
            <span class="noc-title-text">NOC Command Deck</span>
            <span class="noc-guard-chip">roleGuard('admin')</span>
          </div>
        </ion-buttons>

        <ion-buttons slot="end">
          <div class="toolbar-right-group">
            <!-- Lanzador Paleta de Comandos -->
            <button
              type="button"
              class="cmd-trigger-btn"
              (click)="toggleCommandPalette()"
              title="Abrir paleta de comandos rápidos"
            >
              <ion-icon name="search-outline"></ion-icon>
              <span class="hide-sm">Comandos</span>
              <kbd class="cmd-kbd">⌘K</kbd>
            </button>

            <!-- Conmutador de Tema Claro / Oscuro -->
            <button
              type="button"
              class="icon-tool-btn"
              (click)="onToggleTheme()"
              [attr.aria-label]="authService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              title="Alternar tema Claro / Oscuro"
            >
              <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'"></ion-icon>
            </button>

            <!-- Botón Refrescar Telemetría -->
            <button
              type="button"
              class="icon-tool-btn"
              (click)="loadData()"
              [disabled]="isLoading"
              aria-label="Sincronizar telemetría"
              title="Sincronizar telemetría"
            >
              <ion-icon name="refresh-outline" [class.spin]="isLoading"></ion-icon>
            </button>

            <!-- Píldora de Perfil de Administrador (Bien espaciada y nítida) -->
            <button
              type="button"
              id="btn-profile-popover"
              class="profile-pill-btn"
              (click)="toggleDropdown()"
              [attr.aria-expanded]="dropdownOpen()"
            >
              <span class="profile-avatar">
                {{ (authService.currentUser()?.username || 'AD').slice(0, 2).toUpperCase() }}
              </span>
              <span class="profile-meta hide-xs">
                <strong class="profile-username">{{ authService.currentUser()?.username || 'admin' }}</strong>
                <span class="profile-role-tag">ROL: ADMIN</span>
              </span>
              <ion-icon name="chevron-down-outline" class="profile-chevron"></ion-icon>
            </button>

            <!-- Botón Salir directo -->
            <button
              type="button"
              id="btn-admin-logout"
              class="logout-pill-btn"
              (click)="onLogout()"
              aria-label="Cerrar sesión"
            >
              <ion-icon name="log-out-outline"></ion-icon>
              <span class="hide-sm">Salir</span>
            </button>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- POPOVER FLOTANTE DE SESIÓN (FUERA DE ION-HEADER PARA EVITAR CLIPPING DE SHADOW DOM) -->
    <div class="floating-backdrop" *ngIf="dropdownOpen()" (click)="closeDropdown()"></div>
    <aside class="floating-profile-popover" *ngIf="dropdownOpen()" role="dialog" aria-label="Menú de sesión activa">
      <div class="popover-top">
        <div class="popover-avatar">
          {{ (authService.currentUser()?.username || 'AD').slice(0, 2).toUpperCase() }}
        </div>
        <div class="popover-user-info">
          <strong>{{ authService.currentUser()?.username || 'admin' }}</strong>
          <span class="popover-badge-admin">PRIVILEGIO: ADMIN</span>
        </div>
      </div>

      <div class="popover-storage-box">
        <span class="popover-storage-label">sessionStorage['DAM2_AUTH_SESSION']</span>
        <code>{{ rawSessionJson }}</code>
      </div>

      <div class="popover-links">
        <a routerLink="/admin" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="stats-chart-outline"></ion-icon>
          <span>Consola NOC Admin (/admin)</span>
        </a>
        <a routerLink="/tickets" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="ticket-outline"></ion-icon>
          <span>Centro de Incidencias (/tickets)</span>
        </a>
        <a routerLink="/help" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="book-outline"></ion-icon>
          <span>Documentación y Manual (/help)</span>
        </a>
        <a
          href="https://enterprise-hub-di-mauve.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          class="popover-link"
        >
          <ion-icon name="globe-outline"></ion-icon>
          <span>Producción en Vercel</span>
        </a>
      </div>

      <div class="popover-footer">
        <button type="button" class="popover-logout-btn" (click)="onLogout()">
          <ion-icon name="log-out-outline"></ion-icon>
          <span>Cerrar Sesión Segura (logout)</span>
        </button>
      </div>
    </aside>

    <!-- MODAL PALETA DE COMANDOS RÁPIDOS (⌘K) -->
    <div class="floating-backdrop" *ngIf="commandPaletteOpen()" (click)="toggleCommandPalette()"></div>
    <section class="command-palette-modal" *ngIf="commandPaletteOpen()" role="dialog" aria-label="Paleta de comandos">
      <div class="cmd-modal-header">
        <ion-icon name="terminal-outline"></ion-icon>
        <span>Paleta de Comandos Rápidos · EnterpriseHub NOC</span>
        <button type="button" class="cmd-close-btn" (click)="toggleCommandPalette()">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="cmd-modal-grid">
        <button type="button" class="cmd-action-card" (click)="runCommand('csv')">
          <ion-icon name="download-outline"></ion-icon>
          <div>
            <strong>Exportar Telemetría y Tickets (CSV)</strong>
            <span>Genera archivo tabular UTF-8 inmediato</span>
          </div>
        </button>
        <button type="button" class="cmd-action-card" (click)="runCommand('pdf')">
          <ion-icon name="document-text-outline"></ion-icon>
          <div>
            <strong>Generar Informe Ejecutivo (PDF)</strong>
            <span>Documento vectorial con métricas del clúster</span>
          </div>
        </button>
        <button type="button" class="cmd-action-card" (click)="runCommand('theme')">
          <ion-icon name="sunny-outline"></ion-icon>
          <div>
            <strong>Conmutar Tema Claro / Oscuro</strong>
            <span>Alterna entre estética NOC Obsidian y Editorial</span>
          </div>
        </button>
        <button type="button" class="cmd-action-card" (click)="runCommand('tickets')">
          <ion-icon name="ticket-outline"></ion-icon>
          <div>
            <strong>Abrir Centro de Incidencias (/tickets)</strong>
            <span>Gestionar tickets abiertos y SLA</span>
          </div>
        </button>
      </div>
    </section>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="noc-workspace" id="main-content" role="main">

        <!-- CINTA SUPERIOR DE TELEMETRÍA Y AUDITORÍA RBAC (TICKER HORIZONTAL) -->
        <section class="telemetry-ribbon" aria-label="Estado en tiempo real y seguridad RBAC">
          <div class="ribbon-metrics">
            <div class="ribbon-item">
              <span class="ribbon-dot dot-emerald"></span>
              <span class="ribbon-label">CLÚSTER:</span>
              <strong class="ribbon-val text-emerald">OPERATIVO (99.7% SLA)</strong>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">SIGNAL ACTIVO:</span>
              <code class="ribbon-code">currentUser() = '{{ authService.currentUser()?.username }}' [{{ authService.currentUser()?.role }}]</code>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">STORAGE:</span>
              <code class="ribbon-code">sessionStorage['DAM2_AUTH_SESSION']</code>
            </div>
            <div class="ribbon-divider"></div>
            <div class="ribbon-item">
              <span class="ribbon-label">SYNC:</span>
              <strong class="ribbon-val tabular-nums">{{ lastUpdate | date:'HH:mm:ss' }}</strong>
            </div>
          </div>

          <div class="ribbon-actions">
            <button
              type="button"
              class="noc-btn noc-btn--secondary"
              (click)="exportCsv()"
              [disabled]="isExporting"
            >
              <ion-icon name="download-outline"></ion-icon>
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              class="noc-btn noc-btn--primary"
              (click)="exportPdf()"
              [disabled]="isExporting"
            >
              <ion-icon name="document-text-outline"></ion-icon>
              <span>Informe Ejecutivo PDF</span>
            </button>
          </div>
        </section>

        <!-- FACETA 3 UX: Skeleton Loaders en sustitución de Spinners Genéricos -->
        <div *ngIf="isLoading" class="skeleton-bento-grid" role="status" aria-live="polite" aria-label="Cargando telemetría del clúster">
          <div class="skeleton-main-col">
            <div class="skeleton-panel">
              <div class="skeleton-top-row">
                <ion-skeleton-text [animated]="true" style="width: 35%; height: 24px; border-radius: 6px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 25%; height: 28px; border-radius: 999px;"></ion-skeleton-text>
              </div>
              <div class="skeleton-kpis-strip">
                <ion-skeleton-text [animated]="true" style="width: 23%; height: 55px; border-radius: 8px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 23%; height: 55px; border-radius: 8px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 23%; height: 55px; border-radius: 8px;"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 23%; height: 55px; border-radius: 8px;"></ion-skeleton-text>
              </div>
              <ion-skeleton-text [animated]="true" style="width: 100%; height: 240px; border-radius: 10px; margin-top: 14px;"></ion-skeleton-text>
            </div>
            <div class="skeleton-blade-rack">
              <ion-skeleton-text [animated]="true" style="width: 100%; height: 48px; border-radius: 8px; margin-bottom: 8px;" *ngFor="let b of [1,2,3,4]"></ion-skeleton-text>
            </div>
          </div>
          <div class="skeleton-side-col">
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 220px; border-radius: 12px; margin-bottom: 12px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 100%; height: 180px; border-radius: 12px;"></ion-skeleton-text>
          </div>
        </div>

        <ng-container *ngIf="!isLoading">

          <!-- REJILLA ASIMÉTRICA BENTO COMMAND DECK -->
          <div class="bento-command-grid">

            <!-- COLUMNA IZQUIERDA (COCKPIT DE TELEMETRÍA + RACK DE NODOS) -->
            <div class="bento-col-main">

              <!-- PANEL 1: COCKPIT HERO DE TELEMETRÍA CON KPIs INTEGRADOS Y SELECTOR DE SERIE -->
              <article class="bento-panel cockpit-panel" role="region" aria-label="Cockpit de telemetría en vivo">
                <header class="cockpit-header">
                  <div>
                    <span class="panel-kicker">TELEMETRÍA DE INFRAESTRUCTURA EN TIEMPO REAL</span>
                    <h1 class="panel-main-title">Monitor de Cómputo, Memoria y Red del Clúster</h1>
                  </div>

                  <!-- Conmutador Interactivo de Modo de Gráfico -->
                  <div class="telemetry-mode-tabs" role="tablist" aria-label="Modo de visualización de telemetría">
                    <button
                      type="button"
                      class="mode-tab"
                      [class.mode-tab--active]="telemetryMode() === 'combined'"
                      (click)="setTelemetryMode('combined')"
                    >
                      CPU + RAM
                    </button>
                    <button
                      type="button"
                      class="mode-tab"
                      [class.mode-tab--active]="telemetryMode() === 'cpu'"
                      (click)="setTelemetryMode('cpu')"
                    >
                      Solo CPU
                    </button>
                    <button
                      type="button"
                      class="mode-tab"
                      [class.mode-tab--active]="telemetryMode() === 'ram'"
                      (click)="setTelemetryMode('ram')"
                    >
                      Solo RAM
                    </button>
                    <button
                      type="button"
                      class="mode-tab"
                      [class.mode-tab--active]="telemetryMode() === 'iops'"
                      (click)="setTelemetryMode('iops')"
                    >
                      Tráfico IOPS
                    </button>
                  </div>
                </header>

                <!-- Banda de 4 KPIs Integrados estilo Instrumentación Aeronáutica/SRE -->
                <div class="cockpit-kpi-strip">
                  <div class="cockpit-kpi" *ngFor="let kpi of kpis" [attr.data-status]="kpi.status">
                    <div class="cockpit-kpi-top">
                      <span class="cockpit-kpi-label">{{ kpi.title }}</span>
                      <span class="cockpit-kpi-delta" [class.delta-up]="kpi.trend > 0" [class.delta-down]="kpi.trend < 0">
                        {{ kpi.trend > 0 ? '+' + kpi.trend + '%' : kpi.trend < 0 ? kpi.trend + '%' : 'ESTABLE' }}
                      </span>
                    </div>
                    <div class="cockpit-kpi-val tabular-nums">
                      {{ kpi.value }}<small *ngIf="kpi.unit">{{ kpi.unit }}</small>
                    </div>
                  </div>
                </div>

                <!-- Lienzo de Telemetría Continua -->
                <div class="cockpit-chart-box">
                  <div class="chart-legend-bar">
                    <span class="legend-item" *ngIf="telemetryMode() === 'combined' || telemetryMode() === 'cpu'">
                      <i class="legend-swatch swatch-emerald"></i> Carga CPU (%)
                    </span>
                    <span class="legend-item" *ngIf="telemetryMode() === 'combined' || telemetryMode() === 'ram'">
                      <i class="legend-swatch swatch-blue"></i> Reserva RAM (%)
                    </span>
                    <span class="legend-item" *ngIf="telemetryMode() === 'iops'">
                      <i class="legend-swatch swatch-cyan"></i> Caudal IOPS (req/s)
                    </span>
                    <span class="legend-sla-note">Umbral preventivo SLA: 85%</span>
                  </div>
                  <div class="chart-canvas-holder">
                    <canvas
                      #telemetryChart
                      role="img"
                      aria-label="Gráfico interactivo de telemetría en tiempo real"
                    ></canvas>
                  </div>
                </div>
              </article>

              <!-- PANEL 2: TOPOLOGÍA DE RACK DE SERVIDORES CON DIAGNÓSTICO INTERACTIVO -->
              <article class="bento-panel rack-panel" role="region" aria-label="Topología de nodos en rack">
                <header class="rack-header">
                  <div>
                    <span class="panel-kicker">MATRIZ DE HARDWARE · DATA CENTER EU-WEST</span>
                    <h2 class="panel-sub-title">Topología de Blades de Servidor &amp; Diagnóstico Activo</h2>
                  </div>
                  <span class="rack-summary-pill tabular-nums">{{ topServers.length }} Blades Conectados</span>
                </header>

                <div class="blade-rack-list">
                  <div
                    *ngFor="let srv of topServers; let idx = index"
                    class="blade-row"
                    [class.blade-row--pinging]="pingingNode() === srv.serverName"
                  >
                    <div class="blade-identity">
                      <span class="blade-slot">SLOT 0{{ idx + 1 }}</span>
                      <div class="blade-host-group">
                        <strong class="blade-hostname">{{ srv.serverName }}</strong>
                        <span class="blade-ip">10.24.1.10{{ idx + 1 }} · {{ srv.networkIn }} MB/s</span>
                      </div>
                    </div>

                    <div class="blade-gauges">
                      <div class="blade-gauge">
                        <div class="gauge-label-row">
                          <span>CPU</span>
                          <strong class="tabular-nums">{{ srv.cpuUsage }}%</strong>
                        </div>
                        <div class="gauge-track">
                          <div
                            class="gauge-fill fill-cpu"
                            [class.fill-warn]="srv.cpuUsage > 75"
                            [class.fill-crit]="srv.cpuUsage > 90"
                            [style.width.%]="srv.cpuUsage"
                          ></div>
                        </div>
                      </div>

                      <div class="blade-gauge">
                        <div class="gauge-label-row">
                          <span>RAM</span>
                          <strong class="tabular-nums">{{ srv.memoryUsage }}%</strong>
                        </div>
                        <div class="gauge-track">
                          <div
                            class="gauge-fill fill-ram"
                            [class.fill-warn]="srv.memoryUsage > 80"
                            [class.fill-crit]="srv.memoryUsage > 92"
                            [style.width.%]="srv.memoryUsage"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div class="blade-actions">
                      <span class="blade-status-badge" [class]="'status-' + srv.status.toLowerCase()">
                        <i class="pip"></i> {{ srv.status }}
                      </span>
                      <button
                        type="button"
                        class="blade-diag-btn"
                        (click)="diagnoseServer(srv.serverName)"
                        [title]="'Ejecutar diagnóstico ICMP sobre ' + srv.serverName"
                      >
                        <ion-icon name="flash-outline"></ion-icon>
                        <span>Diagnosticar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>

            </div>

            <!-- COLUMNA DERECHA (INTELIGENCIA RBAC, ANILLO DE INCIDENCIAS Y TERMINAL SRE) -->
            <div class="bento-col-side">

              <!-- PANEL 3: INSPECTOR DE SEGURIDAD RBAC & SIGNALS -->
              <article class="bento-panel rbac-inspector-panel" role="region" aria-label="Inspector de sesión y control de acceso">
                <header class="side-panel-header">
                  <div>
                    <span class="panel-kicker">VERIFICACIÓN MÓDULO 0488</span>
                    <h2 class="panel-sub-title">Inspector de Signals &amp; Guardas</h2>
                  </div>
                  <div class="shield-badge">
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                  </div>
                </header>

                <div class="signal-readout-grid">
                  <div class="signal-cell">
                    <span class="signal-key">currentUser().username</span>
                    <strong class="signal-val">{{ authService.currentUser()?.username }}</strong>
                  </div>
                  <div class="signal-cell">
                    <span class="signal-key">currentUser().role</span>
                    <strong class="signal-val text-cyan">{{ authService.currentUser()?.role }}</strong>
                  </div>
                  <div class="signal-cell">
                    <span class="signal-key">isAuthenticated()</span>
                    <strong class="signal-val text-emerald">{{ authService.isAuthenticated() }}</strong>
                  </div>
                  <div class="signal-cell">
                    <span class="signal-key">Web Storage API</span>
                    <strong class="signal-val">sessionStorage</strong>
                  </div>
                </div>

                <!-- Matriz de Permisos por Ruta -->
                <div class="perm-matrix">
                  <div class="perm-row">
                    <code>/admin</code>
                    <span class="perm-tag perm-allow">ALLOW · roleGuard('admin')</span>
                  </div>
                  <div class="perm-row">
                    <code>/tickets</code>
                    <span class="perm-tag perm-allow">ALLOW · authGuard</span>
                  </div>
                  <div class="perm-row">
                    <code>/user-dashboard</code>
                    <span class="perm-tag perm-redirect">UrlTree ➔ /admin</span>
                  </div>
                </div>

                <div class="rbac-panel-actions">
                  <a routerLink="/tickets" class="noc-btn noc-btn--secondary full-w">
                    <ion-icon name="ticket-outline"></ion-icon>
                    <span>Gestionar Tickets</span>
                  </a>
                  <button type="button" class="noc-btn noc-btn--danger full-w" (click)="onLogout()">
                    <ion-icon name="log-out-outline"></ion-icon>
                    <span>Ejecutar logout()</span>
                  </button>
                </div>
              </article>

              <!-- PANEL 4: DISTRIBUCIÓN GEOMÉTRICA DE INCIDENCIAS Y SLA -->
              <article class="bento-panel incidents-ring-panel" role="region" aria-label="Distribución de incidencias">
                <header class="side-panel-header">
                  <div>
                    <span class="panel-kicker">VOLUMETRÍA DE SOPORTE</span>
                    <h2 class="panel-sub-title">Estado de Incidencias Activas</h2>
                  </div>
                  <a routerLink="/tickets" class="mini-link">Ver todas ➔</a>
                </header>

                <div class="ring-layout">
                  <div class="ring-canvas-box">
                    <canvas
                      #doughnutChart
                      role="img"
                      aria-label="Anillo de distribución de tickets"
                    ></canvas>
                    <div class="ring-center-label">
                      <strong class="tabular-nums">{{ totalTicketsCount }}</strong>
                      <span>Tickets</span>
                    </div>
                  </div>

                  <div class="ring-legend">
                    <div class="ring-legend-item" *ngFor="let item of ticketLegend">
                      <div class="ring-legend-left">
                        <span class="ring-dot" [style.background]="item.color"></span>
                        <span>{{ item.label }}</span>
                      </div>
                      <strong class="tabular-nums">{{ item.value }}</strong>
                    </div>
                  </div>
                </div>
              </article>

              <!-- PANEL 5: TERMINAL SRE DE AUDITORÍA EN VIVO -->
              <article class="bento-panel terminal-panel" role="region" aria-label="Consola de auditoría de eventos en tiempo real">
                <header class="terminal-header">
                  <div class="terminal-dots">
                    <span class="t-dot t-red"></span>
                    <span class="t-dot t-amber"></span>
                    <span class="t-dot t-green"></span>
                  </div>
                  <span class="terminal-title">sre-audit-stream — DAM2_AUTH_SESSION</span>
                </header>

                <div class="terminal-body">
                  <div class="terminal-line" *ngFor="let log of authService.auditLogs()">
                    <span class="t-time">[{{ log.timestamp }}]</span>
                    <span class="t-type" [attr.data-level]="log.level">{{ log.type }}</span>
                    <span class="t-msg">{{ log.message }}</span>
                  </div>
                </div>
              </article>

            </div>

          </div>

          <!-- PIE DE CONSOLA CON ENLACES OFICIALES DIRECTOS -->
          <footer class="noc-footer">
            <div class="footer-left">
              <strong>EnterpriseHub PWA · Módulo 0488 Desarrollo de Interfaces</strong>
              <span>Autor: Luis Lázaro Pimentel · Instituto Nebrija FP (2º DAM)</span>
            </div>
            <div class="footer-links">
              <a href="https://enterprise-hub-di-mauve.vercel.app" target="_blank" rel="noopener noreferrer">
                <ion-icon name="globe-outline"></ion-icon>
                <span>App Desplegada (Vercel)</span>
              </a>
              <a href="https://github.com/Thepimen/enterprise-hub-pwa" target="_blank" rel="noopener noreferrer">
                <ion-icon name="logo-github"></ion-icon>
                <span>GitHub (enterprise-hub-pwa)</span>
              </a>
              <a href="https://github.com/Thepimen/enterprise-hub-di" target="_blank" rel="noopener noreferrer">
                <ion-icon name="logo-github"></ion-icon>
                <span>GitHub (enterprise-hub-di)</span>
              </a>
            </div>
          </footer>

        </ng-container>
      </main>
    </ion-content>
  `,
  styles: [`
    /* CABECERA NOC UNIFICADA (1 SOLO BOTÓN DE MENÚ) */
    .noc-toolbar {
      --background: var(--surface-card);
      --color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
      padding: 0 12px;
      min-height: 58px;
    }
    .single-menu-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 14px;
      border-radius: 8px;
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      border: 1px solid var(--btn-secondary-border);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .single-menu-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .single-menu-btn ion-icon {
      font-size: 1.15rem;
    }

    .noc-brand-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-left: 14px;
    }
    .noc-live-pip {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .noc-title-text {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .noc-guard-chip {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }

    .toolbar-right-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cmd-trigger-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .cmd-trigger-btn:hover {
      border-color: var(--color-primary-light);
      color: var(--color-text-primary);
    }
    .cmd-kbd {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    .icon-tool-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      cursor: pointer;
    }
    .icon-tool-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    /* PÍLDORA DE PERFIL DE ADMINISTRADOR REDISEÑADA (NÍTIDA Y SIN SOLAPAMIENTOS) */
    .profile-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      height: 38px;
      padding: 0 12px 0 6px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--badge-admin-border);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .profile-pill-btn:hover {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .profile-avatar {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .profile-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .profile-username {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .profile-role-tag {
      font-family: var(--font-mono);
      font-size: 0.64rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 5px;
      background: #2563eb;
      color: #ffffff;
      letter-spacing: 0.04em;
    }
    .profile-chevron {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .logout-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.45);
      color: #f87171;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .logout-pill-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }

    /* POPOVER FLOTANTE DE SESIÓN FUERA DE ION-HEADER */
    .floating-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.45);
      backdrop-filter: blur(2px);
      z-index: 9990;
    }
    .floating-profile-popover {
      position: fixed;
      top: 64px;
      right: 16px;
      width: 310px;
      background: var(--surface-card);
      border: 1px solid var(--badge-admin-border);
      border-radius: 14px;
      box-shadow: var(--shadow-lg);
      padding: 14px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .popover-top {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--color-border);
    }
    .popover-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      color: #ffffff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .popover-user-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .popover-user-info strong {
      font-size: 0.92rem;
      color: var(--color-text-primary);
    }
    .popover-badge-admin {
      font-size: 0.65rem;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.05em;
    }
    .popover-storage-box {
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popover-storage-label {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--color-text-secondary);
    }
    .popover-storage-box code {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: #10b981;
      word-break: break-all;
    }
    .popover-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .popover-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .popover-link:hover {
      background: var(--surface-elevated);
    }
    .popover-link ion-icon {
      color: var(--color-accent);
      font-size: 1.05rem;
    }
    .popover-footer {
      border-top: 1px solid var(--color-border);
      padding-top: 10px;
    }
    .popover-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px;
      border-radius: 8px;
      background: #dc2626;
      color: #ffffff;
      border: none;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* PALETA DE COMANDOS (⌘K) */
    .command-palette-modal {
      position: fixed;
      top: 14%;
      left: 50%;
      transform: translateX(-50%);
      width: min(560px, 92vw);
      background: var(--surface-card);
      border: 1px solid var(--badge-admin-border);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      padding: 16px;
      z-index: 9999;
    }
    .cmd-modal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .cmd-modal-header ion-icon {
      color: var(--color-accent);
      font-size: 1.2rem;
    }
    .cmd-close-btn {
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .cmd-modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }
    @media (max-width: 540px) {
      .cmd-modal-grid { grid-template-columns: 1fr; }
    }
    .cmd-action-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      text-align: left;
      cursor: pointer;
    }
    .cmd-action-card:hover {
      border-color: var(--color-accent);
    }
    .cmd-action-card ion-icon {
      font-size: 1.25rem;
      color: var(--color-accent);
      flex-shrink: 0;
    }
    .cmd-action-card strong {
      display: block;
      font-size: 0.8rem;
      margin-bottom: 2px;
    }
    .cmd-action-card span {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
    }

    /* WORKSPACE PRINCIPAL */
    .noc-workspace {
      max-width: 1440px;
      margin: 0 auto;
      padding: 16px 20px 64px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* CINTA DE TELEMETRÍA Y RBAC */
    .telemetry-ribbon {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-left: 4px solid #06b6d4;
    }
    .ribbon-metrics {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .ribbon-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
    }
    .ribbon-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-emerald {
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .ribbon-label {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--color-text-secondary);
    }
    .ribbon-val {
      color: var(--color-text-primary);
      font-weight: 700;
    }
    .text-emerald { color: #10b981; }
    .text-cyan { color: #06b6d4; }
    .ribbon-code {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 2px 7px;
      border-radius: 5px;
      background: var(--surface-elevated);
      color: var(--color-primary-light);
      border: 1px solid var(--color-border);
    }
    .ribbon-divider {
      width: 1px;
      height: 16px;
      background: var(--color-border);
    }
    .ribbon-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* BOTONES NOC CON CONTRASTE AAA */
    .noc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      height: 36px;
      padding: 0 14px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .noc-btn--primary {
      background: var(--btn-primary-bg);
      color: #ffffff !important;
      border: 1px solid var(--btn-primary-border);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .noc-btn--primary:hover {
      background: var(--btn-primary-bg-hover);
    }
    .noc-btn--secondary {
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      border: 1px solid var(--btn-secondary-border);
    }
    .noc-btn--secondary:hover {
      border-color: var(--color-accent);
    }
    .noc-btn--danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.45);
    }
    .noc-btn--danger:hover {
      background: #ef4444;
      color: #ffffff;
    }
    .full-w { width: 100%; }

    /* REJILLA BENTO ASIMÉTRICA */
    .bento-command-grid {
      display: grid;
      grid-template-columns: 1.72fr 1fr;
      gap: 18px;
      align-items: start;
    }
    @media (max-width: 1120px) {
      .bento-command-grid {
        grid-template-columns: 1fr;
      }
    }
    .bento-col-main,
    .bento-col-side {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .bento-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }
    .panel-kicker {
      font-family: var(--font-mono);
      font-size: 0.66rem;
      font-weight: 800;
      color: var(--color-accent);
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 3px;
    }
    .panel-main-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .panel-sub-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }

    /* COCKPIT DE TELEMETRÍA */
    .cockpit-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .telemetry-mode-tabs {
      display: inline-flex;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 3px;
      gap: 3px;
    }
    .mode-tab {
      padding: 5px 11px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 0.74rem;
      font-weight: 700;
      cursor: pointer;
    }
    .mode-tab--active {
      background: var(--btn-primary-solid);
      color: #ffffff;
    }

    /* KPIs Integrados en Cockpit */
    .cockpit-kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 680px) {
      .cockpit-kpi-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .cockpit-kpi {
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      border-top: 3px solid #3b82f6;
    }
    .cockpit-kpi[data-status="success"] { border-top-color: #10b981; }
    .cockpit-kpi[data-status="warning"] { border-top-color: #f59e0b; }
    .cockpit-kpi[data-status="danger"]  { border-top-color: #ef4444; }
    .cockpit-kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin-bottom: 6px;
    }
    .cockpit-kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-text-secondary);
    }
    .cockpit-kpi-delta {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(148, 163, 184, 0.15);
      color: var(--color-text-secondary);
    }
    .delta-up { color: #10b981; background: rgba(16, 185, 129, 0.15); }
    .delta-down { color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
    .cockpit-kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .cockpit-kpi-val small {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin-left: 2px;
    }

    .cockpit-chart-box {
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .chart-legend-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend-swatch {
      width: 12px;
      height: 4px;
      border-radius: 2px;
      display: inline-block;
    }
    .swatch-emerald { background: #10b981; }
    .swatch-blue    { background: #3b82f6; }
    .swatch-cyan    { background: #06b6d4; }
    .legend-sla-note {
      margin-left: auto;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: #f59e0b;
    }
    .chart-canvas-holder {
      position: relative;
      height: 255px;
    }

    /* TOPOLOGÍA DE BLADES DE RACK */
    .rack-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .rack-summary-pill {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-accent);
    }
    .blade-rack-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .blade-row {
      display: grid;
      grid-template-columns: 1.15fr 1.6fr auto;
      align-items: center;
      gap: 16px;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      transition: all 0.2s ease;
    }
    .blade-row--pinging {
      border-color: #06b6d4;
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.25);
    }
    @media (max-width: 720px) {
      .blade-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }
    .blade-identity {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .blade-slot {
      font-family: var(--font-mono);
      font-size: 0.64rem;
      font-weight: 800;
      padding: 3px 6px;
      border-radius: 4px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }
    .blade-host-group {
      display: flex;
      flex-direction: column;
    }
    .blade-hostname {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .blade-ip {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--color-text-secondary);
    }

    .blade-gauges {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .blade-gauge {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .gauge-label-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--color-text-secondary);
    }
    .gauge-label-row strong {
      color: var(--color-text-primary);
    }
    .gauge-track {
      height: 6px;
      border-radius: 3px;
      background: var(--surface-card);
      overflow: hidden;
    }
    .gauge-fill {
      height: 100%;
      border-radius: 3px;
    }
    .fill-cpu { background: #10b981; }
    .fill-ram { background: #3b82f6; }
    .fill-warn { background: #f59e0b !important; }
    .fill-crit { background: #ef4444 !important; }

    .blade-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .blade-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .blade-status-badge .pip {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }
    .status-online {
      background: rgba(16, 185, 129, 0.16);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }
    .status-degraded {
      background: rgba(245, 158, 11, 0.16);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .status-offline {
      background: rgba(239, 68, 68, 0.16);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .blade-diag-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }
    .blade-diag-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    /* COLUMNA DERECHA: PANELES LATERALES */
    .side-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .shield-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .signal-readout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .signal-cell {
      padding: 10px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .signal-key {
      font-family: var(--font-mono);
      font-size: 0.64rem;
      color: var(--color-text-secondary);
    }
    .signal-val {
      font-family: var(--font-mono);
      font-size: 0.84rem;
      color: var(--color-text-primary);
    }

    .perm-matrix {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
      padding: 10px;
      border-radius: 8px;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
    }
    .perm-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.74rem;
    }
    .perm-row code {
      font-family: var(--font-mono);
      color: var(--color-text-primary);
    }
    .perm-tag {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .perm-allow {
      background: rgba(16, 185, 129, 0.16);
      color: #10b981;
    }
    .perm-redirect {
      background: rgba(59, 130, 246, 0.16);
      color: #60a5fa;
    }
    .rbac-panel-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    /* ANILLO DE INCIDENCIAS */
    .mini-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-primary-light);
      text-decoration: none;
    }
    .ring-layout {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .ring-canvas-box {
      position: relative;
      width: 145px;
      height: 145px;
      flex-shrink: 0;
    }
    .ring-center-label {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .ring-center-label strong {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-text-primary);
      line-height: 1;
    }
    .ring-center-label span {
      font-size: 0.65rem;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      margin-top: 2px;
    }
    .ring-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ring-legend-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-border);
    }
    .ring-legend-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .ring-legend-left {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary);
    }
    .ring-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* TERMINAL SRE DE AUDITORÍA */
    .terminal-panel {
      padding: 0;
      overflow: hidden;
      background: #050811;
      border: 1px solid #1e293b;
    }
    .terminal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
    }
    .terminal-dots {
      display: flex;
      gap: 5px;
    }
    .t-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .t-red   { background: #ef4444; }
    .t-amber { background: #f59e0b; }
    .t-green { background: #10b981; }
    .terminal-title {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .terminal-body {
      padding: 12px 14px;
      max-height: 210px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
    }
    .terminal-line {
      display: flex;
      align-items: baseline;
      gap: 6px;
      line-height: 1.4;
    }
    .t-time { color: #64748b; flex-shrink: 0; }
    .t-type {
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.62rem;
      flex-shrink: 0;
    }
    .t-type[data-level="SUCCESS"] { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .t-type[data-level="WARN"]    { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .t-type[data-level="INFO"]    { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .t-msg { color: #e2e8f0; word-break: break-word; }

    /* PIE DE CONSOLA */
    .noc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      font-size: 0.76rem;
    }
    .footer-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .footer-left strong { color: var(--color-text-primary); }
    .footer-left span { color: var(--color-text-secondary); }
    .footer-links {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer-links a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--color-primary-light);
      font-weight: 700;
      text-decoration: none;
    }
    .footer-links a:hover { text-decoration: underline; }

    
    /* FACETA 3 UX: SKELETON LOADERS */
    .skeleton-bento-grid {
      display: grid;
      grid-template-columns: 8fr 4fr;
      gap: 16px;
      padding: 16px 0;
    }
    @media (max-width: 1100px) {
      .skeleton-bento-grid { grid-template-columns: 1fr; }
    }
    .skeleton-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .skeleton-top-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .skeleton-kpis-strip {
      display: flex;
      gap: 10px;
      justify-content: space-between;
    }
    .skeleton-blade-rack {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 16px;
    }
    .skeleton-side-col {
      display: flex;
      flex-direction: column;
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
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .hide-sm { display: none; }
      .noc-guard-chip { display: none; }
    }
    @media (max-width: 520px) {
      .hide-xs { display: none; }
    }
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
  private latestLiveMetrics: LiveMetrics | null = null;

  readonly dropdownOpen = signal(false);
  readonly commandPaletteOpen = signal(false);
  readonly telemetryMode = signal<TelemetryMode>('combined');
  readonly pingingNode = signal<string | null>(null);

  isLoading = true;
  isExporting = false;
  lastUpdate = new Date();
  kpis: KpiItem[] = [];
  ticketLegend: { label: string; value: number; color: string }[] = [];
  topServers: ReturnType<NoSqlMockService['getCurrentSnapshot']>['servers'] = [];

  private allTickets: Ticket[] = [];
  private metrics!: SummaryMetrics;

  get rawSessionJson(): string {
    if (typeof sessionStorage === 'undefined') return 'null';
    return sessionStorage.getItem('DAM2_AUTH_SESSION') ?? 'null';
  }

  get totalTicketsCount(): number {
    return this.allTickets.length;
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

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
    this.commandPaletteOpen.set(false);
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  toggleCommandPalette(): void {
    this.dropdownOpen.set(false);
    this.commandPaletteOpen.update((v) => !v);
  }

  onToggleTheme(): void {
    this.authService.toggleTheme();
    this.cdr.markForCheck();
  }

  runCommand(cmd: 'csv' | 'pdf' | 'theme' | 'tickets'): void {
    this.commandPaletteOpen.set(false);
    if (cmd === 'csv') this.exportCsv();
    else if (cmd === 'pdf') this.exportPdf();
    else if (cmd === 'theme') this.onToggleTheme();
    else if (cmd === 'tickets') this.router.navigate(['/tickets']);
  }

  setTelemetryMode(mode: TelemetryMode): void {
    this.telemetryMode.set(mode);
    if (this.latestLiveMetrics) {
      this.initTelemetryLineChart(this.latestLiveMetrics);
    }
    this.authService.recordAudit('SYSTEM', 'INFO', `Vista de telemetría cambiada a modo '${mode.toUpperCase()}'`);
  }

  diagnoseServer(serverName: string): void {
    this.pingingNode.set(serverName);
    const latency = (8 + Math.random() * 6).toFixed(1);
    this.authService.recordAudit(
      'SYSTEM',
      'SUCCESS',
      `Diagnóstico ICMP sobre nodo ${serverName}: Paquetes 4/4 OK · RTT ${latency} ms`
    );
    this.notif.success(`Nodo ${serverName} verificado: latencia ${latency} ms`);
    setTimeout(() => {
      this.pingingNode.set(null);
      this.cdr.markForCheck();
    }, 900);
  }

  onLogout(): void {
    this.dropdownOpen.set(false);
    this.commandPaletteOpen.set(false);
    this.authService.logout();
    this.notif.info('Sesión de administrador finalizada.');
  }

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
          this.latestLiveMetrics = live;
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
    this.authService.recordAudit('SYSTEM', 'INFO', `Exportación CSV iniciada por '${this.authService.currentUser()?.username}'`);
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
    this.authService.recordAudit('SYSTEM', 'INFO', `Informe Ejecutivo PDF generado por '${this.authService.currentUser()?.username}'`);
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
        title: 'Nodos Activos',
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
        title: 'Cola de Tickets',
        value: s.openTickets,
        icon: 'alert-circle-outline',
        trend: 5,
        status: s.openTickets > 5 ? 'danger' : 'warning',
      },
      {
        id: 'uptime',
        title: 'SLA Uptime',
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
      { label: 'Abiertos (Críticos)', value: openCount,       color: '#ef4444' },
      { label: 'En resolución',       value: inProgressCount, color: '#f59e0b' },
      { label: 'Resueltos (SLA OK)',  value: resolvedCount,   color: '#10b981' },
      { label: 'Archivados',          value: closedCount,     color: '#64748b' },
    ];
  }

  private initTelemetryLineChart(live: LiveMetrics): void {
    const canvas = this.telemetryChartRef?.nativeElement;
    if (!canvas) return;

    this.telemetryChart?.destroy();

    const labels = live.chartLabels.slice(0, 8);
    const cpuData = live.cpuData.slice(0, 8);
    const memData = live.memoryData.slice(0, 8);
    const iopsData = cpuData.map((c, idx) => Math.min(98, Math.round((c + memData[idx]) / 2 + (idx % 2 === 0 ? 6 : -4))));
    const mode = this.telemetryMode();

    const datasets = [];
    if (mode === 'combined' || mode === 'cpu') {
      datasets.push({
        label: 'CPU (%)',
        data: cpuData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.14)',
        borderWidth: 2.6,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 1.5,
      });
    }
    if (mode === 'combined' || mode === 'ram') {
      datasets.push({
        label: 'RAM (%)',
        data: memData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.14)',
        borderWidth: 2.6,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 1.5,
      });
    }
    if (mode === 'iops') {
      datasets.push({
        label: 'Caudal IOPS (%)',
        data: iopsData,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.16)',
        borderWidth: 2.6,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 1.5,
      });
    }

    this.telemetryChart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
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
            cornerRadius: 8,
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
              font: { size: 11 },
              color: '#94a3b8',
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.15)',
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
        labels: ['Abiertos', 'En resolución', 'Resueltos', 'Archivados'],
        datasets: [
          {
            data: [openCount, inProgressCount, resolvedCount, closedCount],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#64748b'],
            borderColor: 'rgba(15, 23, 42, 0.4)',
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
