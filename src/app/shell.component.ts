/**
 * @file shell.component.ts
 * @description Componente shell que envuelve el layout de ion-split-pane + ion-menu
 * para las rutas protegidas. Evita recursión con AppComponent.
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  IonSplitPane, IonMenu, IonContent, IonList, IonListHeader,
  IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
  IonHeader, IonToolbar, IonButton, IonFooter
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
    IonHeader, IonToolbar, IonButton, IonFooter,
  ],
  template: `
    <ion-split-pane contentId="shell-outlet" when="lg">
      <!-- Menú lateral -->
      <ion-menu contentId="shell-outlet" type="overlay" menuId="main-menu">
        <ion-header>
          <ion-toolbar color="primary">
            <div class="menu-brand" role="banner">
              <ion-icon name="server-outline" class="brand-icon" aria-hidden="true"></ion-icon>
              <div class="brand-text">
                <span class="brand-name">EnterpriseHub</span>
                <span class="brand-tagline">B2B Management</span>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="menu-content">
          <div class="user-profile" *ngIf="currentUser" aria-label="Perfil del usuario actual">
            <div class="user-avatar" aria-hidden="true">{{ getInitials(currentUser.name) }}</div>
            <div class="user-info">
              <p class="user-name">{{ currentUser.name }}</p>
              <p class="user-email">{{ currentUser.email }}</p>
              <span class="user-role" [class]="'role-' + currentUser.role.toLowerCase()">
                {{ currentUser.role }}
              </span>
            </div>
          </div>

          <nav role="navigation" aria-label="Navegación principal">
            <ion-list lines="none" class="nav-list">
              <ion-list-header class="nav-section-header">
                <ion-label>MENÚ PRINCIPAL</ion-label>
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
                    <ion-label>{{ item.title }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ng-container>
            </ion-list>
          </nav>
        </ion-content>

        <ion-footer class="menu-footer">
          <ion-toolbar>
            <ion-button expand="block" fill="outline" color="danger" (click)="logout()" class="logout-btn" aria-label="Cerrar sesión">
              <ion-icon name="log-out-outline" slot="start" aria-hidden="true"></ion-icon>
              Cerrar Sesión
            </ion-button>
          </ion-toolbar>
        </ion-footer>
      </ion-menu>

      <ion-router-outlet id="shell-outlet"></ion-router-outlet>
    </ion-split-pane>
  `,
  styles: [`
    ion-menu { --background: var(--surface-card); --width: 280px; }
    ion-toolbar[color="primary"] { --background: var(--color-primary); }
    .menu-brand { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
    .brand-icon { font-size: 1.8rem; color: white; background: rgba(255,255,255,0.15); padding: 8px; border-radius: 10px; }
    .brand-name  { display: block; font-size: 1.1rem; font-weight: 800; color: white; }
    .brand-tagline { display: block; font-size: 0.68rem; color: rgba(255,255,255,0.7); letter-spacing: 0.05em; }
    .user-profile { display: flex; align-items: center; gap: 12px; padding: 20px 16px 16px; border-bottom: 1px solid var(--color-border); }
    .user-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: white; font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-name  { font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-email { font-size: 0.72rem; color: var(--color-text-secondary); margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role  { font-size: 0.62rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .role-admin { background: var(--color-primary); color: white; }
    .role-user  { background: #0891b2; color: white; }
    .nav-list { padding: 8px 0; }
    .nav-section-header { font-size: 0.68rem !important; letter-spacing: 0.08em !important; color: var(--color-text-secondary) !important; padding: 12px 16px 4px !important; }
    .nav-item { --border-radius: 10px; --padding-start: 12px; margin: 2px 8px; border-radius: 10px; }
    .nav-item ion-icon { font-size: 1.1rem; color: var(--color-text-secondary); }
    .nav-item ion-label { font-size: 0.9rem; font-weight: 500; color: var(--color-text-primary); }
    .nav-item--active { --background: rgba(25,42,86,0.08); }
    .nav-item--active ion-icon { color: var(--color-primary) !important; }
    .nav-item--active ion-label { color: var(--color-primary) !important; font-weight: 700 !important; }
    .menu-footer ion-toolbar { --background: var(--surface-card); padding: 8px; }
    .logout-btn { --border-radius: 10px; font-weight: 600; }
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
