/**
 * @file app.routes.ts
 * @description Configuración central de rutas con Lazy Loading (loadComponent) y Functional Guards.
 * Integra la nueva Landing Page (/welcome) como punto de entrada raíz y control granular por roles.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
    title: 'Bienvenida | EnterpriseHub PWA',
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
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Telemetría de Clúster | EnterpriseHub',
  },
  {
    path: 'admin',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'tickets',
    canActivate: [authGuard, roleGuard(['ADMIN', 'SUPERVISOR', 'USER'])],
    loadComponent: () => import('./pages/tickets/tickets.page').then((m) => m.TicketsPage),
    title: 'Gestión de Incidencias | EnterpriseHub',
  },
  {
    path: 'user-dashboard',
    canActivate: [authGuard, roleGuard(['USER'])],
    loadComponent: () =>
      import('./pages/user-dashboard/user-dashboard.page').then((m) => m.UserDashboardPage),
    title: 'Panel de Operador | EnterpriseHub',
  },
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/help/help.page').then((m) => m.HelpPage),
    title: 'Documentación y Ayuda | EnterpriseHub',
  },
  {
    path: '**',
    redirectTo: 'welcome',
  },
];
