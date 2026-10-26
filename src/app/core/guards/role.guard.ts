/**
 * @file role.guard.ts
 * @description Guard funcional que restringe rutas exclusivas para el rol ADMIN.
 * Redirige a /tickets si el usuario autenticado no tiene rol de administrador.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional de rol ADMIN.
 * Requiere que el usuario esté autenticado Y tenga rol 'ADMIN'.
 */
export const roleGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.state$.pipe(
    take(1),
    map((state) => {
      if (!state.isAuthenticated) {
        return router.createUrlTree(['/login']);
      }
      if (state.user?.role === 'ADMIN') {
        return true;
      }
      // Usuario sin rol ADMIN: redirige a tickets (acceso permitido)
      return router.createUrlTree(['/tickets']);
    })
  );
};
