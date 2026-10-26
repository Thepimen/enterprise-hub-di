/**
 * @file app.routes.ts
 * @description Enrutamiento completo con Lazy Loading y protección mediante Guards.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas
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

  // Rutas protegidas con layout Shell (split-pane + menu)
  {
    path: '',
    loadComponent: () => import('./shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
        canActivate: [roleGuard],
        title: 'Dashboard | EnterpriseHub',
      },
      {
        path: 'tickets',
        loadComponent: () => import('./pages/tickets/tickets.page').then((m) => m.TicketsPage),
        canActivate: [authGuard],
        title: 'Tickets | EnterpriseHub',
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/help/help.page').then((m) => m.HelpPage),
        canActivate: [authGuard],
        title: 'Ayuda | EnterpriseHub',
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
