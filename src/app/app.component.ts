/**
 * @file app.component.ts
 * @description Componente raíz de EnterpriseHub PWA.
 * Incluye el menú lateral desplegable (overlay drawer con secciones colapsables)
 * sincronizado reactivamente con los Signals de AuthService.
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar,
  IonContent, IonFooter, IonIcon, IonMenuToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  serverOutline, shieldCheckmarkOutline, personOutline,
  statsChartOutline, ticketOutline, bookOutline, logOutOutline,
  chevronDownOutline, chevronForwardOutline, lockClosedOutline,
  closeOutline, layersOutline, pulseOutline
} from 'ionicons/icons';
import { MenuController } from '@ionic/angular/standalone';
import { AuthService } from './core/services/auth.service';

addIcons({
  serverOutline, shieldCheckmarkOutline, personOutline,
  statsChartOutline, ticketOutline, bookOutline, logOutOutline,
  chevronDownOutline, chevronForwardOutline, lockClosedOutline,
  closeOutline, layersOutline, pulseOutline
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar,
    IonContent, IonFooter, IonIcon, IonMenuToggle
  ],
  template: `
    <ion-app>
      <!-- Menú Lateral Desplegable (Overlay Drawer bajo demanda) -->
      <ion-menu
        contentId="main-router-outlet"
        menuId="main-menu"
        type="overlay"
        class="enterprise-drawer"
        [disabled]="!authService.isAuthenticated()"
      >
        <ion-header class="ion-no-border">
          <ion-toolbar class="drawer-toolbar">
            <div class="drawer-brand-row">
              <div class="drawer-brand">
                <div class="brand-logo" aria-hidden="true">
                  <ion-icon name="server-outline"></ion-icon>
                </div>
                <div class="brand-titles">
                  <span class="brand-name">EnterpriseHub</span>
                  <span class="brand-sub">RBAC &amp; Telemetry PWA</span>
                </div>
              </div>
              <ion-menu-toggle auto-hide="false">
                <button class="drawer-close-btn" type="button" aria-label="Cerrar menú desplegable">
                  <ion-icon name="close-outline"></ion-icon>
                </button>
              </ion-menu-toggle>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="drawer-content">
          <!-- Tarjeta de Sesión Activa (Signals) -->
          <div class="session-card" *ngIf="authService.currentUser() as session">
            <div class="session-avatar" [class.avatar-admin]="session.role === 'admin'">
              {{ session.username.slice(0, 2).toUpperCase() }}
            </div>
            <div class="session-meta">
              <p class="session-user">{{ session.username }}</p>
              <div class="session-badges">
                <span class="role-pill" [class.role-pill--admin]="session.role === 'admin'" [class.role-pill--user]="session.role === 'user'">
                  {{ session.role === 'admin' ? 'ROL: ADMIN' : 'ROL: USER' }}
                </span>
                <span class="storage-pill">sessionStorage</span>
              </div>
            </div>
          </div>

          <!-- Grupo Desplegable 1: Paneles por Rol (RBAC Guards) -->
          <div class="nav-group">
            <button
              type="button"
              class="nav-group-toggle"
              (click)="toggleSection('rbac')"
              [attr.aria-expanded]="openSections().rbac"
            >
              <span class="nav-group-label">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                Control de Acceso (RBAC)
              </span>
              <ion-icon [name]="openSections().rbac ? 'chevron-down-outline' : 'chevron-forward-outline'" class="chevron-icon"></ion-icon>
            </button>

            <div class="nav-group-items" *ngIf="openSections().rbac">
              <ion-menu-toggle auto-hide="false" *ngIf="authService.currentUser()?.role === 'admin'">
                <a
                  routerLink="/admin"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="stats-chart-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Consola Admin</span>
                    <span class="link-caption">Protegido: roleGuard('admin')</span>
                  </div>
                </a>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <a
                  routerLink="/user-dashboard"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="person-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Panel de Operador</span>
                    <span class="link-caption">Vista UserDashboardPage</span>
                  </div>
                </a>
              </ion-menu-toggle>
            </div>
          </div>

          <!-- Grupo Desplegable 2: Módulos Operativos -->
          <div class="nav-group">
            <button
              type="button"
              class="nav-group-toggle"
              (click)="toggleSection('ops')"
              [attr.aria-expanded]="openSections().ops"
            >
              <span class="nav-group-label">
                <ion-icon name="layers-outline"></ion-icon>
                Módulos de Operaciones
              </span>
              <ion-icon [name]="openSections().ops ? 'chevron-down-outline' : 'chevron-forward-outline'" class="chevron-icon"></ion-icon>
            </button>

            <div class="nav-group-items" *ngIf="openSections().ops">
              <ion-menu-toggle auto-hide="false" *ngIf="authService.currentUser()?.role === 'admin'">
                <a
                  routerLink="/dashboard"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="pulse-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Telemetría Clúster</span>
                    <span class="link-caption">Métricas en tiempo real</span>
                  </div>
                </a>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <a
                  routerLink="/tickets"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="ticket-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Gestión de Incidencias</span>
                    <span class="link-caption">Tickets y SLA activo</span>
                  </div>
                </a>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <a
                  routerLink="/help"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="book-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Documentación y Ayuda</span>
                    <span class="link-caption">Manual técnico y arquitectura</span>
                  </div>
                </a>
              </ion-menu-toggle>
            </div>
          </div>
        </ion-content>

        <ion-footer class="ion-no-border drawer-footer">
          <button
            type="button"
            class="drawer-logout-btn"
            (click)="onLogout()"
            aria-label="Cerrar sesión activa"
          >
            <ion-icon name="log-out-outline"></ion-icon>
            <span>Cerrar Sesión Segura</span>
          </button>
        </ion-footer>
      </ion-menu>

      <!-- Contenedor principal de vistas -->
      <ion-router-outlet id="main-router-outlet"></ion-router-outlet>
    </ion-app>
  `,
  styles: [`
    .enterprise-drawer {
      --width: 300px;
      --background: var(--surface-card);
    }
    .drawer-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border);
      padding: 6px 12px;
    }
    .drawer-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 4px;
    }
    .drawer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .brand-titles {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .drawer-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      transition: background 0.15s;
    }
    .drawer-close-btn:hover {
      background: var(--color-hover);
    }

    .drawer-content {
      --background: var(--surface-card);
    }

    .session-card {
      margin: 14px 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .session-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #059669;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .session-avatar.avatar-admin {
      background: #2563eb;
    }
    .session-meta {
      min-width: 0;
      flex: 1;
    }
    .session-user {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .session-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .role-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .role-pill--admin {
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .role-pill--user {
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .storage-pill {
      font-size: 0.625rem;
      font-family: var(--font-mono);
      color: var(--color-text-secondary);
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* Secciones desplegables (Acordeón) */
    .nav-group {
      margin: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--surface-card);
    }
    .nav-group-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: var(--surface-elevated);
      border: none;
      color: var(--color-text-primary);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: background 0.15s;
    }
    .nav-group-toggle:hover {
      background: var(--color-hover);
    }
    .nav-group-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-group-label ion-icon {
      font-size: 1rem;
      color: var(--color-primary);
    }
    .chevron-icon {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    .nav-group-items {
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .drawer-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 6px;
      text-decoration: none;
      color: var(--color-text-secondary);
      border-left: 3px solid transparent;
      transition: all 0.15s ease;
    }
    .drawer-link:hover {
      background: var(--surface-elevated);
      color: var(--color-text-primary);
    }
    .drawer-link ion-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
      color: var(--color-text-secondary);
    }
    .drawer-link--active {
      background: var(--nav-active-bg) !important;
      color: var(--nav-active-text) !important;
      border-left-color: var(--nav-active-border) !important;
    }
    .drawer-link--active ion-icon {
      color: var(--nav-active-text) !important;
    }
    .drawer-link-text {
      display: flex;
      flex-direction: column;
    }
    .link-title {
      font-size: 0.84rem;
      font-weight: 600;
      line-height: 1.2;
    }
    .link-caption {
      font-size: 0.68rem;
      opacity: 0.8;
      margin-top: 2px;
    }

    .drawer-footer {
      padding: 12px;
      background: var(--surface-card);
      border-top: 1px solid var(--color-border);
    }
    .drawer-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.35);
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .drawer-logout-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }
  `],
})
export class AppComponent {
  readonly authService = inject(AuthService);
  private readonly menuCtrl = inject(MenuController);

  readonly openSections = signal<{ rbac: boolean; ops: boolean }>({
    rbac: true,
    ops: true,
  });

  toggleSection(key: 'rbac' | 'ops'): void {
    this.openSections.update((curr) => ({ ...curr, [key]: !curr[key] }));
  }

  async onLogout(): Promise<void> {
    await this.menuCtrl.close('main-menu');
    this.authService.logout();
  }
}
