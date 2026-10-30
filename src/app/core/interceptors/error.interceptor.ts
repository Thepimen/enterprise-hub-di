/**
 * @file error.interceptor.ts
 * @description Interceptor funcional HTTP (HttpInterceptorFn) para captura global de anomalías de seguridad.
 * Intercepta códigos 401 Unauthorized (fuerza logout reactivo) y 403 Forbidden (notificación accesible).
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.recordAudit(
          'INTERCEPTOR',
          'WARN',
          `HTTP 401 Unauthorized en ${req.url}: Sesión revocada o expirada. Forzando logout.`
        );
        notify.warning('Tu sesión ha expirado o no es válida. Por favor, identifícate de nuevo.');
        authService.logout();
        void router.navigate(['/login']);
      } else if (error.status === 403) {
        authService.recordAudit(
          'INTERCEPTOR',
          'WARN',
          `HTTP 403 Forbidden en ${req.url}: Privilegios insuficientes para el rol actual.`
        );
        notify.error('Acceso denegado (403 Forbidden): No dispones de privilegios para realizar esta acción.');
      }

      return throwError(() => error);
    })
  );
};
