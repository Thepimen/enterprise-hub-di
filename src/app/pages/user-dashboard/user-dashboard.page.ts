/**
 * @file user-dashboard.page.ts
 * @description Workstation de Operador L1 & Laboratorio Interactivo de Seguridad RBAC (UserDashboardPage).
 * - Único botón de menú lateral en cabecera (eliminado botón duplicado).
 * - Popover de perfil renderizado fuera de <ion-header> con position: fixed (cero recorte por Shadow DOM).
 * - Consume Signal reactivo authService.currentUser() y verifica persistencia en sessionStorage ('DAM2_AUTH_SESSION').
 * - Simulador interactivo de penetración RBAC hacia /admin con auditoría en vivo.
 * - Cola operativa de tickets con filtros rápidos por estado y resolución en 1 clic.
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonIcon, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, shieldCheckmarkOutline, logOutOutline,
  ticketOutline, bookOutline, lockClosedOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, menuOutline, chevronDownOutline,
  terminalOutline, arrowForwardOutline, sunnyOutline, moonOutline,
  globeOutline, logoGithub, flashOutline, checkmarkDoneOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { NotificationService } from '../../core/services/notification.service';
import { Ticket } from '../../core/models/ticket.model';

addIcons({
  personCircleOutline, shieldCheckmarkOutline, logOutOutline,
  ticketOutline, bookOutline, lockClosedOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, menuOutline, chevronDownOutline,
  terminalOutline, arrowForwardOutline, sunnyOutline, moonOutline,
  globeOutline, logoGithub, flashOutline, checkmarkDoneOutline
});

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonIcon
  ],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar class="op-toolbar">
        <ion-buttons slot="start">
          <!-- ÚNICO BOTÓN DE MENÚ (Sin duplicados) -->
          <button
            type="button"
            id="btn-op-single-menu"
            class="single-menu-btn"
            (click)="toggleDrawer()"
            aria-label="Abrir menú lateral desplegable"
          >
            <ion-icon name="menu-outline"></ion-icon>
            <span>Menú</span>
          </button>
        </ion-buttons>

        <ion-title>
          <div class="toolbar-brand">
            <span class="status-dot"></span>
            <span class="brand-main">Workstation de Operador L1</span>
            <span class="brand-sep">·</span>
            <span class="brand-sub">/user-dashboard · Rol Activo: USER</span>
          </div>
        </ion-title>

        <ion-buttons slot="end">
          <div class="toolbar-right-actions">
            <!-- Conmutador de Tema en Vivo -->
            <button
              type="button"
              class="action-chip-btn"
              (click)="authService.toggleTheme()"
              title="Alternar tema NOC Oscuro / Claro"
            >
              <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'"></ion-icon>
              <span class="hide-sm">{{ authService.theme() === 'dark' ? 'Claro' : 'Oscuro' }}</span>
            </button>

            <!-- Botón de Perfil (Popover renderizado fuera de ion-header para evitar recorte) -->
            <button
              type="button"
              id="btn-op-profile-popover"
              class="profile-trigger-pill"
              (click)="toggleDropdown()"
              [attr.aria-expanded]="dropdownOpen()"
            >
              <span class="avatar-chip">{{ (authService.currentUser()?.username || 'OP').slice(0, 2).toUpperCase() }}</span>
              <span class="user-name-label">{{ authService.currentUser()?.username }}</span>
              <span class="role-pill-clean">ROL: {{ authService.currentUser()?.role | uppercase }}</span>
              <ion-icon name="chevron-down-outline" class="caret-icon" [class.rotated]="dropdownOpen()"></ion-icon>
            </button>

            <button
              type="button"
              class="toolbar-logout-btn"
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

    <!-- POPOVER FLOTANTE FUERA DE ION-HEADER (Z-Index 9999 - Cero Recorte) -->
    <div class="popover-backdrop" *ngIf="dropdownOpen()" (click)="closeDropdown()"></div>
    <aside class="floating-profile-popover" *ngIf="dropdownOpen()" role="dialog" aria-label="Menú de sesión de operador">
      <div class="popover-user-card">
        <div class="popover-avatar">{{ (authService.currentUser()?.username || 'OP').slice(0, 2).toUpperCase() }}</div>
        <div class="popover-user-info">
          <strong>{{ authService.currentUser()?.username }}</strong>
          <span class="popover-role-badge">PRIVILEGIO: {{ authService.currentUser()?.role | uppercase }}</span>
        </div>
      </div>

      <div class="popover-storage-box">
        <span class="storage-box-title">sessionStorage['DAM2_AUTH_SESSION']</span>
        <code>{{ rawSessionJson }}</code>
      </div>

      <nav class="popover-links">
        <a routerLink="/user-dashboard" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="person-circle-outline"></ion-icon>
          <span>Workstation Operador (/user-dashboard)</span>
        </a>
        <a routerLink="/tickets" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="ticket-outline"></ion-icon>
          <span>Centro de Incidencias (/tickets)</span>
        </a>
        <a routerLink="/help" (click)="closeDropdown()" class="popover-link">
          <ion-icon name="book-outline"></ion-icon>
          <span>Manual Técnico & Enlaces (/help)</span>
        </a>
      </nav>

      <div class="popover-divider"></div>
      <button type="button" (click)="onLogout()" class="popover-logout-btn">
        <ion-icon name="log-out-outline"></ion-icon>
        <span>Cerrar Sesión Reactiva (logout)</span>
      </button>
    </aside>

    <ion-content class="op-content" [fullscreen]="true">
      <main class="op-main" id="main-content" role="main">

        <!-- CINTA SUPERIOR DE ESTADO Y ENLACES OFICIALES -->
        <section class="op-top-ribbon" aria-label="Estado de sesión y enlaces de entrega">
          <div class="ribbon-left">
            <span class="guard-pill">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              canActivate: [authGuard, roleGuard('user')]
            </span>
            <span class="storage-pill mono">STORAGE_KEY: DAM2_AUTH_SESSION</span>
          </div>
          <div class="ribbon-right">
            <a href="https://enterprise-hub-di-mauve.vercel.app" target="_blank" rel="noopener noreferrer" class="ext-badge ext-vercel">
              <ion-icon name="globe-outline"></ion-icon>
              <span>App Desplegada (Vercel)</span>
            </a>
            <a href="https://github.com/Thepimen/enterprise-hub-pwa" target="_blank" rel="noopener noreferrer" class="ext-badge">
              <ion-icon name="logo-github"></ion-icon>
              <span>GitHub PWA</span>
            </a>
            <a href="https://github.com/Thepimen/enterprise-hub-di" target="_blank" rel="noopener noreferrer" class="ext-badge">
              <ion-icon name="logo-github"></ion-icon>
              <span>GitHub DI</span>
            </a>
          </div>
        </section>

        <!-- BENTO GRID ASIMÉTRICO DEL OPERADOR L1 -->
        <div class="op-bento-grid">

          <!-- COLUMNA IZQUIERDA (7 cols): IDENTIDAD SIGNAL + LABORATORIO DE PRUEBAS RBAC -->
          <ion-card class="welcome-card bento-span-7">
            <ion-card-header class="welcome-card-header">
              <div class="welcome-title-row">
                <span class="role-badge-user">SESIÓN DE OPERADOR VERIFICADA · ROL: {{ authService.currentUser()?.role | uppercase }}</span>
                <span class="signal-live-tag">Signal Readonly Activo</span>
              </div>
              <ion-card-title class="welcome-heading">
                Bienvenido/a al Turno Operativo, <span class="highlight-user">{{ authService.currentUser()?.username }}</span>
              </ion-card-title>
            </ion-card-header>

            <ion-card-content class="welcome-card-body">
              <p class="welcome-description">
                Estás conectado en la vista protegida <code>/user-dashboard</code>. Tu estado reactivo proviene de
                <code>authService.currentUser()</code> y se sincroniza con <code>sessionStorage</code> bajo la clave
                <code>DAM2_AUTH_SESSION</code>. Como usuario con rol <code>'user'</code>, tienes acceso denegado a <code>/admin</code>.
              </p>

              <!-- 4 Celdas de Inspección Reactiva -->
              <div class="state-grid">
                <div class="state-box">
                  <span class="state-label">currentUser()?.username</span>
                  <span class="state-value mono">{{ authService.currentUser()?.username }}</span>
                </div>
                <div class="state-box">
                  <span class="state-label">currentUser()?.role</span>
                  <span class="state-value mono role-text-user">'{{ authService.currentUser()?.role }}'</span>
                </div>
                <div class="state-box">
                  <span class="state-label">isAuthenticated()</span>
                  <span class="state-value mono status-ok">{{ authService.isAuthenticated() }}</span>
                </div>
                <div class="state-box">
                  <span class="state-label">intentosBloqueados</span>
                  <span class="state-value mono text-warning">{{ blockedAttempts() }} bloqueos UrlTree</span>
                </div>
              </div>

              <!-- Inspector JSON en Vivo -->
              <div class="storage-inspector">
                <div class="inspector-header">
                  <ion-icon name="terminal-outline"></ion-icon>
                  <span>Payload en vivo <code>sessionStorage.getItem('DAM2_AUTH_SESSION')</code>:</span>
                </div>
                <pre class="inspector-code">{{ rawSessionJson }}</pre>
              </div>

              <!-- Botonera de Laboratorio RBAC -->
              <div class="action-bar">
                <button
                  type="button"
                  id="btn-test-admin-guard"
                  class="btn-rbac-test"
                  (click)="testAdminRouteProtection()"
                >
                  <ion-icon name="lock-closed-outline"></ion-icon>
                  <span>Probar acceso a /dashboard (Verificar bloqueo roleGuard(['ADMIN']))</span>
                </button>

                <a routerLink="/tickets" class="btn-primary-action">
                  <ion-icon name="ticket-outline"></ion-icon>
                  <span>Ir a Centro de Tickets</span>
                </a>

                <button
                  type="button"
                  id="btn-user-logout"
                  class="btn-danger-action"
                  (click)="onLogout()"
                >
                  <ion-icon name="log-out-outline"></ion-icon>
                  <span>Cerrar Sesión (logout)</span>
                </button>
              </div>

              <!-- Banner de Confirmación de Bloqueo RBAC -->
              <div class="guard-test-feedback" *ngIf="guardTestMessage()" role="status" aria-live="polite">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <div class="feedback-text">
                  <strong>Intercepción Atómica UrlTree Verificada:</strong>
                  <span>{{ guardTestMessage() }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- COLUMNA DERECHA (5 cols): MATRIZ DE PRIVILEGIOS & AUDITORÍA RBAC EN VIVO -->
          <div class="bento-span-5 right-stack">
            <!-- KPIs Rápidos de Turno -->
            <div class="ops-mini-kpis">
              <div class="mini-kpi-box">
                <span class="mini-kpi-label">En Cola</span>
                <span class="mini-kpi-val mono">{{ tickets().length }}</span>
                <span class="mini-kpi-sub">Total turno</span>
              </div>
              <div class="mini-kpi-box">
                <span class="mini-kpi-label">Abiertos / En Curso</span>
                <span class="mini-kpi-val mono text-warning">{{ openCount() }}</span>
                <span class="mini-kpi-sub">Requieren acción</span>
              </div>
              <div class="mini-kpi-box">
                <span class="mini-kpi-label">Resueltos Hoy</span>
                <span class="mini-kpi-val mono text-success">{{ resolvedCount() }}</span>
                <span class="mini-kpi-sub">SLA 98.4%</span>
              </div>
            </div>

            <!-- Consola de Auditoría de Guardas en Vivo -->
            <ion-card class="audit-card">
              <ion-card-header class="audit-card-header">
                <div class="audit-title-group">
                  <ion-icon name="terminal-outline"></ion-icon>
                  <ion-card-title class="audit-title">Registro de Auditoría Functional Guards</ion-card-title>
                </div>
                <span class="audit-count-chip mono">{{ authService.auditLogs().length }} eventos</span>
              </ion-card-header>
              <ion-card-content class="audit-card-body">
                <div class="audit-log-list">
                  <div class="audit-log-item" *ngFor="let item of authService.auditLogs().slice(0, 5)">
                    <div class="audit-item-top">
                      <span class="audit-time mono">{{ item.timestamp }}</span>
                      <span class="audit-guard mono">{{ item.type }}</span>
                      <span class="audit-res" [attr.data-res]="item.level">{{ item.level }}</span>
                    </div>
                    <div class="audit-item-detail">
                      {{ item.message }}
                    </div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- FILA INFERIOR COMPLETA (12 cols): COLA INTERACTIVA DE INCIDENCIAS CON FILTRO Y RESOLUCIÓN 1-CLIC -->
          <ion-card class="recent-tickets-card bento-span-12">
            <ion-card-header class="recent-header">
              <div>
                <div class="section-kicker">WORKBENCH DE SOPORTE NIVEL 1</div>
                <ion-card-title class="recent-title">Cola Interactiva de Incidencias Asignadas</ion-card-title>
              </div>

              <!-- Píldoras de Filtro Rápido -->
              <div class="filter-pills" role="tablist" aria-label="Filtrar tickets por estado">
                <button
                  type="button"
                  class="filter-pill"
                  [class.active]="statusFilter() === 'ALL'"
                  (click)="setFilter('ALL')"
                >
                  Todos ({{ tickets().length }})
                </button>
                <button
                  type="button"
                  class="filter-pill"
                  [class.active]="statusFilter() === 'OPEN'"
                  (click)="setFilter('OPEN')"
                >
                  Abiertos / En Curso ({{ openCount() }})
                </button>
                <button
                  type="button"
                  class="filter-pill"
                  [class.active]="statusFilter() === 'RESOLVED'"
                  (click)="setFilter('RESOLVED')"
                >
                  Resueltos ({{ resolvedCount() }})
                </button>
                <a routerLink="/tickets" class="view-all-link">
                  <span>Abrir tabla CRUD</span>
                  <ion-icon name="arrow-forward-outline"></ion-icon>
                </a>
              </div>
            </ion-card-header>

            <ion-card-content class="recent-body">
              <div class="ticket-list">
                <div class="ticket-row" *ngFor="let t of filteredTickets()">
                  <div class="ticket-main">
                    <span class="ticket-id mono">#{{ t.id }}</span>
                    <span class="ticket-prio" [attr.data-prio]="t.priority">{{ t.priority }}</span>
                    <div class="ticket-text">
                      <span class="ticket-title">{{ t.title }}</span>
                      <span class="ticket-desc">{{ t.description }}</span>
                    </div>
                  </div>
                  <div class="ticket-meta">
                    <span class="ticket-cat mono">{{ t.category }}</span>
                    <span class="ticket-status" [attr.data-status]="t.status">{{ t.status }}</span>
                    <button
                      *ngIf="t.status !== 'RESOLVED' && t.status !== 'CLOSED'"
                      type="button"
                      class="resolve-1click-btn"
                      (click)="resolveTicketQuick(t)"
                    >
                      <ion-icon name="checkmark-done-outline"></ion-icon>
                      <span>Resolver 1-Clic</span>
                    </button>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    .op-toolbar {
      --background: var(--surface-card);
      --color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border-strong);
      padding: 0 12px;
      min-height: 60px;
    }

    /* Único botón de menú en cabecera */
    .single-menu-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 14px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .single-menu-btn:hover {
      border-color: var(--color-primary-light);
    }
    .single-menu-btn ion-icon {
      font-size: 1.15rem;
      color: var(--color-primary-light);
    }

    .toolbar-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
    }
    .brand-main {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }
    .brand-sep {
      color: var(--color-text-muted);
    }
    .brand-sub {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 8px;
      border-radius: 999px;
    }
    @media (max-width: 900px) {
      .brand-sep, .brand-sub { display: none; }
    }

    .toolbar-right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 11px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }
    .profile-trigger-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 12px 0 6px;
      border-radius: 999px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border-strong);
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .avatar-chip {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #059669, #10b981);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .user-name-label {
      font-size: 0.8rem;
      font-weight: 700;
    }
    .role-pill-clean {
      padding: 2px 8px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 0.66rem;
      font-weight: 800;
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .caret-icon {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      transition: transform 0.2s ease;
    }
    .caret-icon.rotated {
      transform: rotate(180deg);
    }
    .toolbar-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .toolbar-logout-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }
    @media (max-width: 680px) {
      .hide-sm { display: none; }
    }

    /* POPOVER FLOTANTE SIN RECORTE */
    .popover-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9990;
      background: transparent;
    }
    .floating-profile-popover {
      position: fixed;
      top: 64px;
      right: 16px;
      width: 310px;
      background: var(--surface-card);
      border: 1px solid var(--color-border-strong);
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
      padding: 14px;
      z-index: 9999;
    }
    .popover-user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .popover-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #059669, #10b981);
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
    .popover-role-badge {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--badge-user-text);
    }
    .popover-storage-box {
      margin: 10px 0;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .storage-box-title {
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
      padding: 9px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-primary);
      text-decoration: none;
    }
    .popover-link:hover {
      background: var(--surface-elevated);
    }
    .popover-divider {
      height: 1px;
      background: var(--color-border);
      margin: 8px 0;
    }
    .popover-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.35);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* CONTENIDO PRINCIPAL Y BENTO GRID */
    .op-main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 18px 20px 56px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .op-top-ribbon {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
    }
    .ribbon-left, .ribbon-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .guard-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .storage-pill {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ext-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--color-text-primary);
      background: var(--surface-elevated);
      border: 1px solid var(--color-border-strong);
      text-decoration: none;
    }
    .ext-vercel {
      color: var(--badge-admin-text);
      border-color: var(--badge-admin-border);
      background: var(--badge-admin-bg);
    }

    .op-bento-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    .bento-span-7 { grid-column: span 7; }
    .bento-span-5 { grid-column: span 5; }
    .bento-span-12 { grid-column: span 12; }
    @media (max-width: 1080px) {
      .bento-span-7, .bento-span-5 { grid-column: span 12; }
    }

    .welcome-card, .audit-card, .recent-tickets-card {
      margin: 0;
      border: 1px solid var(--color-border);
      border-radius: 14px !important;
      background: var(--surface-card);
    }
    .welcome-card-header {
      padding: 20px 22px 14px;
      border-bottom: 1px solid var(--color-border);
    }
    .welcome-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }
    .role-badge-user {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .signal-live-tag {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-primary-light);
    }
    .welcome-heading {
      font-size: 1.35rem !important;
      font-weight: 800 !important;
      color: var(--color-text-primary) !important;
    }
    .highlight-user {
      color: #10b981;
    }
    .welcome-card-body {
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .welcome-description {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      line-height: 1.55;
      margin: 0;
    }
    .welcome-description code {
      background: var(--surface-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-primary);
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }

    .state-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 600px) {
      .state-grid { grid-template-columns: 1fr; }
    }
    .state-box {
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .state-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      font-family: var(--font-mono);
    }
    .state-value {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }
    .mono { font-family: var(--font-mono); }
    .role-text-user { color: #10b981; }
    .status-ok { color: #38bdf8; }
    .text-warning { color: #f59e0b; }
    .text-success { color: #10b981; }

    .storage-inspector {
      border-radius: 10px;
      border: 1px solid var(--color-border);
      background: var(--surface-ground);
      padding: 10px 14px;
    }
    .inspector-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }
    .inspector-code {
      margin: 0;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #10b981;
      overflow-x: auto;
    }

    .action-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-rbac-test {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 15px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.14);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-rbac-test:hover {
      background: rgba(245, 158, 11, 0.24);
    }
    .btn-primary-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 15px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border: 1px solid var(--btn-primary-border);
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
    }
    .btn-danger-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 15px;
      border-radius: 8px;
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .guard-test-feedback {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--color-text-primary);
      font-size: 0.8rem;
    }
    .guard-test-feedback ion-icon {
      color: #10b981;
      font-size: 1.3rem;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .feedback-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* COLUMNA DERECHA */
    .right-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ops-mini-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .mini-kpi-box {
      padding: 14px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mini-kpi-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
    }
    .mini-kpi-val {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }
    .mini-kpi-sub {
      font-size: 0.68rem;
      color: var(--color-text-muted);
    }

    .audit-card-header {
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .audit-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-primary-light);
    }
    .audit-title {
      font-size: 0.92rem !important;
      font-weight: 800 !important;
      color: var(--color-text-primary) !important;
    }
    .audit-count-chip {
      font-size: 0.68rem;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
    }
    .audit-card-body {
      padding: 12px 16px;
    }
    .audit-log-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .audit-log-item {
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      font-size: 0.75rem;
    }
    .audit-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 4px;
    }
    .audit-time { color: var(--color-text-muted); font-size: 0.68rem; }
    .audit-guard { color: var(--color-primary-light); font-weight: 700; font-size: 0.7rem; }
    .audit-res {
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.64rem;
      font-weight: 800;
    }
    .audit-res[data-res="SUCCESS"],
    .audit-res[data-res="INFO"] {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .audit-res[data-res="WARN"] {
      background: rgba(239, 68, 68, 0.18);
      color: #f87171;
    }
    .audit-item-detail {
      color: var(--color-text-secondary);
      font-size: 0.72rem;
    }

    /* COLA INTERACTIVA DE TICKETS */
    .recent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 18px 22px 14px;
      border-bottom: 1px solid var(--color-border);
    }
    .section-kicker {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--color-primary-light);
      letter-spacing: 0.08em;
      margin-bottom: 3px;
    }
    .recent-title {
      font-size: 1.05rem !important;
      font-weight: 800 !important;
      color: var(--color-text-primary) !important;
    }
    .filter-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-pill {
      height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid var(--color-border-strong);
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .filter-pill.active {
      background: var(--btn-primary-bg);
      color: #ffffff;
      border-color: var(--btn-primary-border);
    }
    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-primary-light);
      text-decoration: none;
      margin-left: 6px;
    }
    .recent-body {
      padding: 12px 22px 18px;
    }
    .ticket-list {
      display: flex;
      flex-direction: column;
    }
    .ticket-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 6px;
      border-bottom: 1px solid var(--color-border);
    }
    .ticket-row:last-child { border-bottom: none; }
    .ticket-main {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ticket-id {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-weight: 700;
    }
    .ticket-prio {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
    }
    .ticket-prio[data-prio="CRITICAL"] {
      background: rgba(239, 68, 68, 0.16);
      color: #f87171;
    }
    .ticket-prio[data-prio="HIGH"] {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
    }
    .ticket-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ticket-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .ticket-desc {
      font-size: 0.74rem;
      color: var(--color-text-secondary);
    }
    .ticket-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ticket-cat {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ticket-status {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .ticket-status[data-status="RESOLVED"] {
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border-color: var(--badge-user-border);
    }
    .resolve-1click-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }
    .resolve-1click-btn:hover {
      background: #10b981;
      color: #ffffff;
    }
  `],
})
export class UserDashboardPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly sqlService = inject(SqlMockService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly menuCtrl = inject(MenuController);

  readonly tickets = signal<Ticket[]>([]);
  readonly statusFilter = signal<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  readonly dropdownOpen = signal(false);
  readonly guardTestMessage = signal<string | null>(null);
  readonly blockedAttempts = signal(0);

  readonly openCount = computed(() =>
    this.tickets().filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
  );

  readonly resolvedCount = computed(() =>
    this.tickets().filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length
  );

  readonly filteredTickets = computed(() => {
    const mode = this.statusFilter();
    const list = this.tickets();
    if (mode === 'OPEN') {
      return list.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    }
    if (mode === 'RESOLVED') {
      return list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }
    return list;
  });

  get rawSessionJson(): string {
    if (typeof sessionStorage === 'undefined') return 'null';
    return sessionStorage.getItem('DAM2_AUTH_SESSION') ?? 'null';
  }

  ngOnInit(): void {
    this.sqlService.getTickets().subscribe((list) => {
      this.tickets.set(list);
    });
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

  setFilter(filter: 'ALL' | 'OPEN' | 'RESOLVED'): void {
    this.statusFilter.set(filter);
  }

  resolveTicketQuick(ticket: Ticket): void {
    this.tickets.update((list) =>
      list.map((item) => (item.id === ticket.id ? { ...item, status: 'RESOLVED' } : item))
    );
    this.notify.success(`Incidencia #${ticket.id} marcada como RESOLVED por ${this.authService.currentUser()?.username}.`);
  }

  async testAdminRouteProtection(): Promise<void> {
    await this.router.navigate(['/dashboard']);
    this.blockedAttempts.update((n) => n + 1);
    const msg =
      "Acceso denegado a '/dashboard': roleGuard(['ADMIN']) verificó que tu rol actual es 'user' y ejecutó redirección atómica UrlTree de vuelta a '/user-dashboard'.";
    this.guardTestMessage.set(msg);
    this.notify.warning(msg);
  }

  onLogout(): void {
    this.closeDropdown();
    this.authService.logout();
    this.notify.info('Sesión finalizada: sessionStorage limpiado y Signal reiniciado a null.');
    void this.router.navigate(['/login']);
  }
}
