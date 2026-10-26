/**
 * @file admin.page.ts
 * @description Página de Administración (/admin) protegida explícitamente mediante
 * canActivate: [authGuard, roleGuard('admin')].
 * Renderiza la Consola de Administración e Infraestructura con verificación de Signals
 * (authService.currentUser()), cierre de sesión (logout()) y telemetría en tiempo real.
 */
import { Component, inject } from '@angular/core';
import { DashboardPage } from '../dashboard/dashboard.page';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DashboardPage],
  template: `<app-dashboard></app-dashboard>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class AdminPage {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
