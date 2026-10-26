/**
 * @file role.guard.ts
 * @description Factoría funcional de control de acceso granular basado en roles (RBAC).
 * Evalúa el signal authService.currentUser() y deniega el acceso redirigiendo atómicamente con UrlTree.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRole: 'admin' | 'user'): CanActivateFn => {
  return (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const session = authService.currentUser();

    if (session?.role === allowedRole) {
      return true;
    }

    // Si un usuario 'user' intenta acceder a ruta de 'admin', redirige atómicamente a '/user-dashboard'
    // Si un 'admin' intenta acceder a ruta exclusiva de 'user', redirige a '/admin'
    if (session?.role === 'admin') {
      return router.createUrlTree(['/admin']);
    }
    return router.createUrlTree(['/user-dashboard']);
  };
};
