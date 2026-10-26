/**
 * @file auth.guard.ts
 * @description Functional Guard puro (CanActivateFn) de autenticación para Angular Standalone.
 * Verifica reactivamente el signal computado authService.isAuthenticated() y redirige
 * atómicamente mediante UrlTree preservando returnUrl.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  authService.recordAudit(
    'GUARD',
    'WARN',
    `authGuard: Acceso sin sesión a '${state.url}' interceptado -> Redirigido a /login?returnUrl=${encodeURIComponent(state.url)}`
  );

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
