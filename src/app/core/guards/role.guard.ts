/**
 * @file role.guard.ts
 * @description Factoría funcional de control de acceso granular basado en roles (RBAC).
 * Evalúa el signal authService.currentUser() y deniega el acceso redirigiendo atómicamente con UrlTree.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRole: 'admin' | 'user'): CanActivateFn => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const session = authService.currentUser();

    if (session?.role === allowedRole) {
      authService.recordAudit(
        'GUARD',
        'SUCCESS',
        `roleGuard('${allowedRole}'): Acceso autorizado a '${state.url}' para usuario '${session.username}'`
      );
      return true;
    }

    authService.recordAudit(
      'GUARD',
      'WARN',
      `roleGuard('${allowedRole}'): Acceso DENEGADO a '${state.url}' para rol '${session?.role}'. Redirección atómica UrlTree aplicada.`
    );

    if (session?.role === 'admin') {
      return router.createUrlTree(['/admin']);
    }
    return router.createUrlTree(['/user-dashboard']);
  };
};
