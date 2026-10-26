/**
 * @file shell.component.ts
 * @description Componente shell que envuelve el layout de ion-split-pane + ion-menu
 * para las rutas protegidas.
 * Refactorizado según las directrices de Taste Skill (app-screens.md §3):
 * - Barra lateral sobria y neutra con regla de 1px
 * - Sin degradados estridentes en avatares ni barra de título superior
 * - Marca clara, estado activo con píldora neutra y tipografía funcional
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  IonSplitPane, IonMenu, IonContent, IonList, IonListHeader,
  IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
  IonHeader, IonToolbar, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline, ticketOutline, bookOutline, logOutOutline,
  personCircleOutline, serverOutline
} from 'ionicons/icons';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/auth.model';

addIcons({ statsChartOutline, ticketOutline, bookOutline, logOutOutline, personCircleOutline, serverOutline });

interface NavItem {
  title: string;
  url: string;
  icon: string;
  adminOnly: boolean;
  ariaLabel: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive,
    IonSplitPane, IonMenu, IonContent, IonList, IonListHeader,
    IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
    IonHeader, IonToolbar, IonFooter,
  ],
  template: `
    <ion-split-pane contentId="shell-outlet" when="lg">
      <!-- Menú lateral sobrio -->
      <ion-menu contentId="shell-outlet" type="overlay" menuId="main-menu" class="enterprise-menu">
        <ion-header>
          <ion-toolbar class="menu-brand-toolbar">
            <div class="menu-brand" role="banner">
              <div class="brand-monogram" aria-hidden="true">
                <ion-icon name="server-outline"></ion-icon>
              </div>
              <div class="brand-text">
                <span class="brand-name">EnterpriseHub</span>
                <span class="brand-tagline">Consola B2B</span>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="menu-content">
          <!-- Perfil de operador -->
          <div class="user-profile" *ngIf="currentUser" aria-label="Operador en sesión">
            <div class="user-avatar" aria-hidden="true">{{ getInitials(currentUser.name) }}</div>
            <div class="user-info">
              <p class="user-name">{{ currentUser.name }}</p>
              <p class="user-email">{{ currentUser.email }}</p>
              <span class="user-role-badge" [class]="'badge-' + currentUser.role.toLowerCase()">
                {{ currentUser.role === 'ADMIN' ? 'Administrador' : 'Operador' }}
              </span>
            </div>
          </div>

          <!-- Navegación principal -->
          <nav role="navigation" aria-label="Navegación principal">
            <ion-list lines="none" class="nav-list">
              <ion-list-header class="nav-section-header">
                <ion-label>Módulos de Sistema</ion-label>
              </ion-list-header>
              <ng-container *ngFor="let item of visibleNavItems">
                <ion-menu-toggle auto-hide="false">
                  <ion-item
                    [routerLink]="item.url"
                    routerLinkActive="nav-item--active"
                    [routerLinkActiveOptions]="{ exact: false }"
                    detail="false"
                    class="nav-item"
                    [attr.aria-label]="item.ariaLabel"
                    [attr.aria-current]="isActive(item.url) ? 'page' : null"
                  >
                    <ion-icon [name]="item.icon" slot="start" aria-hidden="true"></ion-icon>
                    <ion-label class="nav-label">{{ item.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ng-container>
            </ion-list>
          </nav>
        </ion-content>

        <ion-footer class="menu-footer">
          <ion-toolbar class="footer-toolbar">
            <button class="logout-action-btn" (click)="logout()" aria-label="Cerrar sesión segura">
              <ion-icon name="log-out-outline" aria-hidden="true"></ion-icon>
              <span>Finalizar Sesión</span>
            </button>
          </ion-toolbar>
        </ion-footer>
      </ion-menu>

      <ion-router-outlet id="shell-outlet"></ion-router-outlet>
    </ion-split-pane>
  `,
  styles: [`
    ion-menu {
      --background: var(--surface-card);
      --width: 260px;
      border-right: 1px solid var(--color-border);
    }
    .menu-brand-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border);
      padding: 6px 4px;
    }
    .menu-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
    }
    .brand-monogram {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--surface-ground);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .brand-name {
      display: block;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    .brand-tagline {
      display: block;
      font-size: 0.6875rem;
      color: var(--color-text-secondary);
      letter-spacing: 0.02em;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 14px;
      border-bottom: 1px solid var(--color-border);
      background: var(--surface-ground);
      margin: 8px 10px 12px;
      border-radius: 8px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-email {
      font-size: 0.6875rem;
      color: var(--color-text-secondary);
      margin: 1px 0 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-role-badge {
      display: inline-block;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      letter-spacing: 0.02em;
    }
    .badge-admin {
      background: rgba(15, 23, 42, 0.08);
      color: #0f172a;
      border: 1px solid rgba(15, 23, 42, 0.2);
    }
    .badge-user {
      background: rgba(37, 99, 235, 0.08);
      color: #2563eb;
      border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .nav-list { padding: 4px 0; background: transparent; }
    .nav-section-header {
      font-size: 0.6875rem !important;
      font-weight: 600 !important;
      letter-spacing: 0.04em !important;
      color: var(--color-text-disabled) !important;
      padding: 8px 16px 6px !important;
      text-transform: uppercase;
    }
    .nav-item {
      --background: transparent;
      --border-radius: 6px;
      --padding-start: 10px;
      --min-height: 36px;
      margin: 2px 8px;
      border-radius: 6px;
      color: var(--color-text-secondary);
      transition: all 0.12s ease;
    }
    .nav-item ion-icon {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin-right: 10px;
    }
    .nav-label {
      font-size: 0.8125rem !important;
      font-weight: 500 !important;
      color: var(--color-text-secondary) !important;
      letter-spacing: -0.01em;
    }
    /* Estado activo neutro sobrio (Taste Skill: neutral pill) */
    .nav-item--active {
      --background: var(--color-hover) !important;
    }
    .nav-item--active ion-icon {
      color: var(--color-text-primary) !important;
    }
    .nav-item--active .nav-label {
      color: var(--color-text-primary) !important;
      font-weight: 600 !important;
    }

    .footer-toolbar {
      --background: var(--surface-card);
      border-top: 1px solid var(--color-border);
      padding: 8px 10px;
    }
    .logout-action-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.12s;
    }
    .logout-action-btn:hover {
      background: rgba(220, 38, 38, 0.06);
      color: #dc2626;
      border-color: rgba(220, 38, 38, 0.2);
    }
  `]
})
export class ShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser: User | null = null;

  private readonly allNavItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart-outline', adminOnly: true,  ariaLabel: 'Ir al Dashboard' },
    { title: 'Tickets',   url: '/tickets',   icon: 'ticket-outline',      adminOnly: false, ariaLabel: 'Ir a Tickets' },
    { title: 'Ayuda',     url: '/help',      icon: 'book-outline',        adminOnly: false, ariaLabel: 'Ir a Ayuda' },
  ];

  get visibleNavItems(): NavItem[] {
    const isAdmin = this.currentUser?.role === 'ADMIN';
    return this.allNavItems.filter((i) => !i.adminOnly || isAdmin);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => { this.currentUser = u; });
  }

  logout(): void { this.authService.logout(); }
  isActive(url: string): boolean { return this.router.url.startsWith(url); }
  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }
}
