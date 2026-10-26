/**
 * @file auth.guard.ts
 * @description Guard funcional que protege rutas autenticadas.
 * Redirige al login si no hay sesión activa.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional de autenticación (Angular 15+ style).
 * Verifica el estado del BehaviorSubject de AuthService.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.state$.pipe(
    take(1),
    map((state) => {
      if (state.isAuthenticated) {
        return true;
      }
      // Redirige al login preservando la URL destino
      return router.createUrlTree(['/login']);
    })
  );
};
