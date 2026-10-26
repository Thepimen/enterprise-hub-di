/**
 * @file app.routes.ts
 * @description Enrutamiento modular con Lazy Loading (loadComponent) y protección mediante
 * Functional Guards (authGuard y factoría roleGuard('admin' | 'user')).
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
    title: 'Iniciar Sesión | EnterpriseHub',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
    title: 'Crear Cuenta | EnterpriseHub',
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
    title: 'Consola de Administración | EnterpriseHub',
  },
  {
    path: 'user-dashboard',
    canActivate: [authGuard, roleGuard('user')],
    loadComponent: () =>
      import('./pages/user-dashboard/user-dashboard.page').then((m) => m.UserDashboardPage),
    title: 'Panel de Operador | EnterpriseHub',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Telemetría de Clúster | EnterpriseHub',
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tickets/tickets.page').then((m) => m.TicketsPage),
    title: 'Gestión de Incidencias | EnterpriseHub',
  },
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/help/help.page').then((m) => m.HelpPage),
    title: 'Documentación y Ayuda | EnterpriseHub',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
