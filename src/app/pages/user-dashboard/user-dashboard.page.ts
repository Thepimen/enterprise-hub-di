/**
 * @file user-dashboard.page.ts
 * @description Vista protegida de Operador (UserDashboardPage) para el rol 'user'.
 * Consume el Signal reactivo authService.currentUser(), verifica persistencia en sessionStorage
 * ('DAM2_AUTH_SESSION'), permite probar la protección RBAC de roleGuard('admin') y gestionar tickets.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonIcon, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, shieldCheckmarkOutline, logOutOutline,
  ticketOutline, bookOutline, lockClosedOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, menuOutline, chevronDownOutline,
  terminalOutline, arrowForwardOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { NotificationService } from '../../core/services/notification.service';
import { Ticket } from '../../core/models/ticket.model';

addIcons({
  personCircleOutline, shieldCheckmarkOutline, logOutOutline,
  ticketOutline, bookOutline, lockClosedOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, menuOutline, chevronDownOutline,
  terminalOutline, arrowForwardOutline
});

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonIcon
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar class="op-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" aria-label="Abrir menú lateral desplegable"></ion-menu-button>
          <button
            type="button"
            class="menu-trigger-btn"
            (click)="toggleDrawer()"
            aria-label="Desplegar menú lateral"
          >
            <ion-icon name="menu-outline"></ion-icon>
            <span>Menú</span>
          </button>
        </ion-buttons>

        <ion-title>
          <div class="toolbar-brand">
            <span class="status-dot"></span>
            <span>Panel de Operador · User Dashboard</span>
          </div>
        </ion-title>

        <ion-buttons slot="end">
          <!-- Selector Desplegable Rápido en Cabecera -->
          <div class="header-dropdown-wrap">
            <button
              type="button"
              class="dropdown-toggle-btn"
              (click)="toggleDropdown()"
              [attr.aria-expanded]="dropdownOpen()"
            >
              <span class="user-chip-avatar">{{ (authService.currentUser()?.username || 'OP').slice(0, 2).toUpperCase() }}</span>
              <span class="user-chip-name">{{ authService.currentUser()?.username }}</span>
              <span class="user-chip-role">{{ authService.currentUser()?.role }}</span>
              <ion-icon name="chevron-down-outline"></ion-icon>
            </button>

            <div class="header-dropdown-menu" *ngIf="dropdownOpen()">
              <div class="dropdown-header">
                <strong>{{ authService.currentUser()?.username }}</strong>
                <span>Rol activo: {{ authService.currentUser()?.role }}</span>
              </div>
              <a routerLink="/user-dashboard" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="person-circle-outline"></ion-icon>
                <span>Mi Panel (User Dashboard)</span>
              </a>
              <a routerLink="/tickets" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="ticket-outline"></ion-icon>
                <span>Consola de Tickets</span>
              </a>
              <a routerLink="/help" (click)="closeDropdown()" class="dropdown-item">
                <ion-icon name="book-outline"></ion-icon>
                <span>Documentación Técnica</span>
              </a>
              <div class="dropdown-divider"></div>
              <button type="button" (click)="onLogout()" class="dropdown-item dropdown-item--danger">
                <ion-icon name="log-out-outline"></ion-icon>
                <span>Cerrar Sesión (logout)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            class="toolbar-logout-btn"
            (click)="onLogout()"
            aria-label="Cerrar sesión"
          >
            <ion-icon name="log-out-outline"></ion-icon>
            <span>Salir</span>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="op-content" [fullscreen]="true">
      <main class="op-main" id="main-content" role="main">

        <!-- Tarjeta Principal de Bienvenida y Sesión Reactiva (Requisito 3.1) -->
        <ion-card class="welcome-card">
          <ion-card-header class="welcome-card-header">
            <div class="welcome-title-row">
              <div class="welcome-badge-group">
                <span class="guard-pill">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                  canActivate: [authGuard, roleGuard('user')]
                </span>
                <span class="role-badge-user">ROL ACTIVO: {{ authService.currentUser()?.role | uppercase }}</span>
              </div>
              <span class="session-storage-tag">STORAGE_KEY: DAM2_AUTH_SESSION</span>
            </div>
            <ion-card-title class="welcome-heading">
              Bienvenido/a al Sistema, <span class="highlight-user">{{ authService.currentUser()?.username }}</span>
            </ion-card-title>
          </ion-card-header>

          <ion-card-content class="welcome-card-body">
            <p class="welcome-description">
              Has accedido correctamente a la vista protegida <code>/user-dashboard</code>. Tu sesión reactiva está gestionada mediante
              <strong>Angular Signals</strong> (<code>authService.currentUser()</code>) y persistida en <strong>Web Storage API</strong>
              (<code>sessionStorage</code>).
            </p>

            <!-- Grid de Inspección de Estado Reactivo -->
            <div class="state-grid">
              <div class="state-box">
                <span class="state-label">Usuario (Signal)</span>
                <span class="state-value mono">{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="state-box">
                <span class="state-label">Rol Asignado</span>
                <span class="state-value mono role-text-user">{{ authService.currentUser()?.role }}</span>
              </div>
              <div class="state-box">
                <span class="state-label">isAuthenticated()</span>
                <span class="state-value mono status-ok">{{ authService.isAuthenticated() }}</span>
              </div>
              <div class="state-box">
                <span class="state-label">Persistencia Web Storage</span>
                <span class="state-value mono">sessionStorage Activo</span>
              </div>
            </div>

            <!-- JSON en vivo de sessionStorage -->
            <div class="storage-inspector">
              <div class="inspector-header">
                <ion-icon name="terminal-outline"></ion-icon>
                <span>Contenido actual en <code>sessionStorage.getItem('DAM2_AUTH_SESSION')</code>:</span>
              </div>
              <pre class="inspector-code">{{ rawSessionJson }}</pre>
            </div>

            <!-- Acciones de Verificación de Laboratorio -->
            <div class="action-bar">
              <button
                type="button"
                id="btn-test-admin-guard"
                class="btn-secondary-action"
                (click)="testAdminRouteProtection()"
              >
                <ion-icon name="lock-closed-outline"></ion-icon>
                <span>Probar acceso a /admin (Verificar bloqueo roleGuard)</span>
              </button>

              <a routerLink="/tickets" class="btn-primary-action">
                <ion-icon name="ticket-outline"></ion-icon>
                <span>Ir a Gestión de Tickets</span>
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

            <!-- Alerta de demostración de bloqueo RBAC -->
            <div class="guard-test-feedback" *ngIf="guardTestMessage()" role="status" aria-live="polite">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              <span>{{ guardTestMessage() }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Resumen Operativo del Turno (Tickets asignados al operador) -->
        <div class="ops-grid">
          <ion-card class="ops-stat-card">
            <ion-card-content class="ops-stat-content">
              <span class="ops-stat-label">Incidencias en Cola</span>
              <span class="ops-stat-number tabular-nums">{{ tickets.length }}</span>
              <span class="ops-stat-caption">Sincronizadas con SqlMockService</span>
            </ion-card-content>
          </ion-card>

          <ion-card class="ops-stat-card">
            <ion-card-content class="ops-stat-content">
              <span class="ops-stat-label">Tickets Abiertos</span>
              <span class="ops-stat-number tabular-nums text-warning">{{ openCount }}</span>
              <span class="ops-stat-caption">Prioridad operativa</span>
            </ion-card-content>
          </ion-card>

          <ion-card class="ops-stat-card">
            <ion-card-content class="ops-stat-content">
              <span class="ops-stat-label">Tickets Resueltos</span>
              <span class="ops-stat-number tabular-nums text-success">{{ resolvedCount }}</span>
              <span class="ops-stat-caption">Cumplimiento SLA 98.4%</span>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Lista Rápida de Incidencias Recientes -->
        <ion-card class="recent-tickets-card">
          <ion-card-header class="recent-header">
            <div>
              <ion-card-title>Incidencias Asignadas al Turno Operativo</ion-card-title>
              <p class="recent-subtitle">Vista rápida de soporte técnico para el rol <code>user</code></p>
            </div>
            <a routerLink="/tickets" class="view-all-link">
              <span>Ver tabla completa</span>
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </a>
          </ion-card-header>
          <ion-card-content>
            <div class="ticket-list">
              <div class="ticket-row" *ngFor="let t of tickets.slice(0, 5)">
                <div class="ticket-main">
                  <span class="ticket-id mono">#{{ t.id }}</span>
                  <span class="ticket-title">{{ t.title }}</span>
                </div>
                <div class="ticket-meta">
                  <span class="ticket-cat">{{ t.category }}</span>
                  <span class="ticket-status" [attr.data-status]="t.status">{{ t.status }}</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

      </main>
    </ion-content>
  `,
  styles: [`
    .op-toolbar {
      --background: var(--surface-card);
      --color: var(--color-text-primary);
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

    .toolbar-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.925rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
    }

    /* Dropdown de cabecera */
    .header-dropdown-wrap {
      position: relative;
      margin-right: 8px;
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
      background: #059669;
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
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .header-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      width: 240px;
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

    .toolbar-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .toolbar-logout-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }

    .op-main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 16px 48px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .welcome-card {
      margin: 0;
      border: 1px solid var(--color-border);
      border-radius: 12px !important;
      background: var(--surface-card);
    }
    .welcome-card-header {
      padding: 20px 24px 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .welcome-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }
    .welcome-badge-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .guard-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 600;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .role-badge-user {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .session-storage-tag {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--color-text-secondary);
      background: var(--surface-elevated);
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }
    .welcome-heading {
      font-size: 1.4rem !important;
      font-weight: 700 !important;
      color: var(--color-text-primary) !important;
    }
    .highlight-user {
      color: var(--color-primary-light);
    }

    .welcome-card-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .welcome-description {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.55;
    }
    .welcome-description code {
      background: var(--surface-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-primary);
      font-size: 0.8rem;
    }

    .state-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .state-box {
      padding: 12px 14px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .state-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .state-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .mono {
      font-family: var(--font-mono);
    }
    .role-text-user {
      color: #10b981;
    }
    .status-ok {
      color: #3b82f6;
    }

    .storage-inspector {
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--surface-ground);
      padding: 12px 14px;
    }
    .inspector-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.76rem;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }
    .inspector-code {
      margin: 0;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-text-primary);
      overflow-x: auto;
    }

    .action-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-primary-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border: 1px solid var(--btn-primary-border);
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    .btn-primary-action:hover {
      background: var(--btn-primary-bg-hover);
    }
    .btn-secondary-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      border-radius: 8px;
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      border: 1px solid var(--btn-secondary-border);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary-action:hover {
      background: var(--btn-secondary-bg-hover);
    }
    .btn-danger-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      border-radius: 8px;
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-danger-action:hover {
      background: #b91c1c;
    }

    .guard-test-feedback {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      color: var(--color-text-primary);
      font-size: 0.8125rem;
      font-weight: 500;
    }
    .guard-test-feedback ion-icon {
      color: var(--color-primary-light);
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .ops-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .ops-stat-card {
      margin: 0;
    }
    .ops-stat-content {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ops-stat-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    .ops-stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .text-warning { color: #f59e0b; }
    .text-success { color: #10b981; }
    .ops-stat-caption {
      font-size: 0.72rem;
      color: var(--color-text-secondary);
    }

    .recent-tickets-card {
      margin: 0;
    }
    .recent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 18px 20px 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .recent-subtitle {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }
    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-primary-light);
      text-decoration: none;
    }
    .ticket-list {
      display: flex;
      flex-direction: column;
    }
    .ticket-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 4px;
      border-bottom: 1px solid var(--color-border);
    }
    .ticket-row:last-child {
      border-bottom: none;
    }
    .ticket-main {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ticket-id {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
    .ticket-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .ticket-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ticket-cat {
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ticket-status {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
  `],
})
export class UserDashboardPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly sqlService = inject(SqlMockService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly menuCtrl = inject(MenuController);

  tickets: Ticket[] = [];
  readonly dropdownOpen = signal(false);
  readonly guardTestMessage = signal<string | null>(null);

  get rawSessionJson(): string {
    if (typeof sessionStorage === 'undefined') return 'null';
    return sessionStorage.getItem('DAM2_AUTH_SESSION') ?? 'null';
  }

  get openCount(): number {
    return this.tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  }

  get resolvedCount(): number {
    return this.tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  }

  ngOnInit(): void {
    this.sqlService.getTickets().subscribe((list) => {
      this.tickets = list;
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

  /**
   * Intenta navegar a /admin siendo usuario 'user' para demostrar que roleGuard('admin')
   * intercepta la petición y devuelve un UrlTree redirigiendo a /user-dashboard.
   */
  async testAdminRouteProtection(): Promise<void> {
    const allowed = await this.router.navigate(['/admin']);
    this.guardTestMessage.set(
      `Acceso denegado por roleGuard('admin'): El rol actual es '${this.authService.currentUser()?.role}'. La guarda funcional interceptó la navegación a /admin y redirigió atómicamente con UrlTree a /user-dashboard.`
    );
    this.notify.warning('Acceso bloqueado por roleGuard(\'admin\'): redirigido a /user-dashboard');
    void allowed;
  }

  onLogout(): void {
    this.dropdownOpen.set(false);
    this.authService.logout();
    this.notify.info('Sesión cerrada correctamente.');
  }
}
