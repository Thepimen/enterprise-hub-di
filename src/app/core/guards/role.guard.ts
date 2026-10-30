/**
 * @file role.guard.ts
 * @description Factoría funcional de control de acceso granular basado en roles (RBAC).
 * Valida los privilegios del token/sesión frente a una lista de roles permitidos ('ADMIN' | 'SUPERVISOR' | 'USER').
 * Si el rol no está autorizado, deniega el acceso y retorna un UrlTree hacia la ruta operativa permitida.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SystemRole } from '../models/auth.model';

export type AllowedRolesInput = SystemRole[] | SystemRole | string[];

/**
 * Factoría de Functional Guard para validación estricta de roles.
 * @param allowedRoles Lista o rol individual autorizado para la ruta
 */
export const roleGuard = (allowedRoles: AllowedRolesInput): CanActivateFn => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Verificar autenticación previa
    if (!authService.isAuthenticated()) {
      authService.recordAudit(
        'GUARD',
        'WARN',
        `roleGuard: Acceso no autenticado a '${state.url}' interceptado -> Redirigiendo a /login`
      );
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const session = authService.currentUser();
    const userRole = (session?.role ?? '').toUpperCase();

    // Normalizar lista de roles permitidos a mayúsculas
    const normalizedAllowed: string[] = Array.isArray(allowedRoles)
      ? allowedRoles.map((r) => String(r).toUpperCase())
      : [String(allowedRoles).toUpperCase()];

    // 2. Comprobar si el rol del usuario está autorizado
    if (normalizedAllowed.includes(userRole)) {
      authService.recordAudit(
        'GUARD',
        'SUCCESS',
        `roleGuard([${normalizedAllowed.join(', ')}]): Acceso AUTORIZADO a '${state.url}' para usuario '${session?.username}' (${userRole})`
      );
      return true;
    }

    // 3. Acceso denegado: redirección atómica mediante UrlTree a la ruta operativa correspondiente
    authService.recordAudit(
      'GUARD',
      'WARN',
      `roleGuard([${normalizedAllowed.join(', ')}]): Acceso DENEGADO a '${state.url}' para rol '${userRole}'. Redirigiendo a vista permitida.`
    );

    // Si es un usuario estándar, enviarlo a su workstation o tickets
    if (userRole === 'USER') {
      return router.createUrlTree(['/user-dashboard']);
    }

    return router.createUrlTree(['/tickets']);
  };
};
