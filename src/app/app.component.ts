/**
 * @file app.component.ts
 * @description Componente raíz de EnterpriseHub NOC Command Center.
 * Incluye:
 * - Menú Lateral Desplegable (Overlay Drawer bajo demanda) con secciones acordeón
 * - Conmutador en vivo de Tema (Oscuro NOC / Claro Editorial)
 * - Enlaces directos al despliegue en producción (Vercel) y repositorios GitHub
 * - Barra de navegación inferior adaptativa (Mobile Bottom Dock) para pantallas móviles
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar,
  IonContent, IonFooter, IonIcon, IonMenuToggle, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  serverOutline, shieldCheckmarkOutline, personOutline,
  statsChartOutline, ticketOutline, bookOutline, logOutOutline,
  chevronDownOutline, chevronForwardOutline, lockClosedOutline,
  closeOutline, layersOutline, pulseOutline, sunnyOutline,
  moonOutline, globeOutline, logoGithub, openOutline, terminalOutline
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';

addIcons({
  serverOutline, shieldCheckmarkOutline, personOutline,
  statsChartOutline, ticketOutline, bookOutline, logOutOutline,
  chevronDownOutline, chevronForwardOutline, lockClosedOutline,
  closeOutline, layersOutline, pulseOutline, sunnyOutline,
  moonOutline, globeOutline, logoGithub, openOutline, terminalOutline
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
                  <ion-icon name="terminal-outline"></ion-icon>
                </div>
                <div class="brand-titles">
                  <span class="brand-name">EnterpriseHub <span class="brand-ver">v2.0</span></span>
                  <span class="brand-sub">NOC &amp; RBAC Command Deck</span>
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
              <div class="session-user-row">
                <p class="session-user">{{ session.username }}</p>
                <span class="online-pip" title="Sesión activa"></span>
              </div>
              <div class="session-badges">
                <span class="role-pill" [class.role-pill--admin]="session.role === 'admin'" [class.role-pill--user]="session.role === 'user'">
                  {{ session.role === 'admin' ? 'ADMIN PRIVILEGE' : 'OPERATOR L1' }}
                </span>
                <span class="storage-pill">DAM2_AUTH_SESSION</span>
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
                    <span class="link-title">NOC Command Center</span>
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
                    <span class="link-title">Workstation Operador</span>
                    <span class="link-caption">Protegido: roleGuard('user')</span>
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
              <ion-menu-toggle auto-hide="false">
                <a
                  routerLink="/tickets"
                  routerLinkActive="drawer-link--active"
                  class="drawer-link"
                >
                  <ion-icon name="ticket-outline"></ion-icon>
                  <div class="drawer-link-text">
                    <span class="link-title">Centro de Incidencias</span>
                    <span class="link-caption">Gestión de tickets y SLA</span>
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
                    <span class="link-title">Manual y Arquitectura</span>
                    <span class="link-caption">Documentación 0488</span>
                  </div>
                </a>
              </ion-menu-toggle>
            </div>
          </div>

          <!-- Grupo Desplegable 3: Enlaces Oficiales de Entrega -->
          <div class="nav-group">
            <button
              type="button"
              class="nav-group-toggle"
              (click)="toggleSection('links')"
              [attr.aria-expanded]="openSections().links"
            >
              <span class="nav-group-label">
                <ion-icon name="globe-outline"></ion-icon>
                Enlaces Oficiales Entrega
              </span>
              <ion-icon [name]="openSections().links ? 'chevron-down-outline' : 'chevron-forward-outline'" class="chevron-icon"></ion-icon>
            </button>

            <div class="nav-group-items" *ngIf="openSections().links">
              <a
                href="https://enterprise-hub-di-mauve.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                class="drawer-link"
              >
                <ion-icon name="globe-outline"></ion-icon>
                <div class="drawer-link-text">
                  <span class="link-title">App Producción (Vercel)</span>
                  <span class="link-caption">enterprise-hub-di-mauve.vercel.app</span>
                </div>
              </a>
              <a
                href="https://github.com/Thepimen/enterprise-hub-pwa"
                target="_blank"
                rel="noopener noreferrer"
                class="drawer-link"
              >
                <ion-icon name="logo-github"></ion-icon>
                <div class="drawer-link-text">
                  <span class="link-title">GitHub · enterprise-hub-pwa</span>
                  <span class="link-caption">Repositorio principal Git Flow</span>
                </div>
              </a>
              <a
                href="https://github.com/Thepimen/enterprise-hub-di"
                target="_blank"
                rel="noopener noreferrer"
                class="drawer-link"
              >
                <ion-icon name="logo-github"></ion-icon>
                <div class="drawer-link-text">
                  <span class="link-title">GitHub · enterprise-hub-di</span>
                  <span class="link-caption">Repositorio espejo DI 0488</span>
                </div>
              </a>
            </div>
          </div>
        </ion-content>

        <ion-footer class="ion-no-border drawer-footer">
          <button
            type="button"
            class="drawer-theme-btn"
            (click)="authService.toggleTheme()"
          >
            <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'"></ion-icon>
            <span>Cambiar a Modo {{ authService.theme() === 'dark' ? 'Claro' : 'Oscuro' }}</span>
          </button>
          <button
            type="button"
            class="drawer-logout-btn"
            (click)="onLogout()"
            aria-label="Cerrar sesión activa"
          >
            <ion-icon name="log-out-outline"></ion-icon>
            <span>Finalizar Sesión (logout)</span>
          </button>
        </ion-footer>
      </ion-menu>

      <!-- Contenedor principal de vistas -->
      <ion-router-outlet id="main-router-outlet"></ion-router-outlet>

      <!-- Barra Inferior Adaptativa para Móvil (Responsive Bottom Dock) -->
      <nav
        class="mobile-bottom-dock"
        *ngIf="authService.isAuthenticated()"
        aria-label="Navegación rápida móvil"
      >
        <a
          *ngIf="authService.currentUser()?.role === 'admin'"
          routerLink="/admin"
          routerLinkActive="dock-item--active"
          class="dock-item"
        >
          <ion-icon name="stats-chart-outline"></ion-icon>
          <span>NOC Admin</span>
        </a>
        <a
          routerLink="/user-dashboard"
          routerLinkActive="dock-item--active"
          class="dock-item"
        >
          <ion-icon name="person-outline"></ion-icon>
          <span>Operador</span>
        </a>
        <a
          routerLink="/tickets"
          routerLinkActive="dock-item--active"
          class="dock-item"
        >
          <ion-icon name="ticket-outline"></ion-icon>
          <span>Tickets</span>
        </a>
        <a
          routerLink="/help"
          routerLinkActive="dock-item--active"
          class="dock-item"
        >
          <ion-icon name="book-outline"></ion-icon>
          <span>Manual</span>
        </a>
      </nav>
    </ion-app>
  `,
  styles: [`
    .enterprise-drawer {
      --width: 310px;
      --background: var(--surface-card);
    }
    .drawer-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border);
      padding: 8px 12px;
    }
    .drawer-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px;
    }
    .drawer-brand {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
    }
    .brand-titles {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-ver {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(6, 182, 212, 0.16);
      color: #22d3ee;
      border: 1px solid rgba(6, 182, 212, 0.35);
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      font-weight: 600;
    }
    .drawer-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .drawer-content {
      --background: var(--surface-card);
    }

    .session-card {
      margin: 14px 12px;
      padding: 12px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .session-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .session-avatar.avatar-admin {
      background: linear-gradient(135deg, #2563eb, #06b6d4);
    }
    .session-meta {
      min-width: 0;
      flex: 1;
    }
    .session-user-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .session-user {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }
    .online-pip {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .session-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .role-pill {
      font-size: 0.62rem;
      font-weight: 800;
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
      font-size: 0.6rem;
      font-family: var(--font-mono);
      color: var(--color-text-secondary);
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .nav-group {
      margin: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: 10px;
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
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
    }
    .nav-group-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-group-label ion-icon {
      font-size: 1rem;
      color: var(--color-accent);
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
      border-radius: 8px;
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
    }
    .drawer-link--active {
      background: var(--nav-active-bg) !important;
      color: var(--nav-active-text) !important;
      border-left-color: var(--nav-active-border) !important;
    }
    .drawer-link-text {
      display: flex;
      flex-direction: column;
    }
    .link-title {
      font-size: 0.82rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .link-caption {
      font-size: 0.67rem;
      opacity: 0.8;
      margin-top: 2px;
    }

    .drawer-footer {
      padding: 12px;
      background: var(--surface-card);
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .drawer-theme-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .drawer-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.14);
      color: #f87171;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .drawer-logout-btn:hover {
      background: #ef4444;
      color: #ffffff;
    }

    /* Mobile Bottom Dock (Solo pantallas <= 768px) */
    .mobile-bottom-dock {
      display: none;
    }
    @media (max-width: 768px) {
      .mobile-bottom-dock {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 58px;
        background: var(--surface-card);
        border-top: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        justify-content: space-around;
        z-index: 900;
        padding: 0 8px;
      }
      .dock-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        text-decoration: none;
        color: var(--color-text-secondary);
        font-size: 0.68rem;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 8px;
      }
      .dock-item ion-icon {
        font-size: 1.2rem;
      }
      .dock-item--active {
        color: var(--nav-active-text);
        background: var(--nav-active-bg);
      }
    }
  `],
})
export class AppComponent {
  readonly authService = inject(AuthService);
  private readonly menuCtrl = inject(MenuController);

  readonly openSections = signal<{ rbac: boolean; ops: boolean; links: boolean }>({
    rbac: true,
    ops: true,
    links: true,
  });

  toggleSection(key: 'rbac' | 'ops' | 'links'): void {
    this.openSections.update((curr) => ({ ...curr, [key]: !curr[key] }));
  }

  async onLogout(): Promise<void> {
    await this.menuCtrl.close('main-menu');
    this.authService.logout();
  }
}
