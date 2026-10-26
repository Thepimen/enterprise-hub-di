/**
 * @file auth.service.ts
 * @description Servicio de autenticación reactivo con Angular Signals y persistencia en Web Storage API (sessionStorage).
 * Implementa validación de credenciales multinivel ('admin' | 'user') conforme al laboratorio de Control de Acceso (Módulo 0488).
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { RegisterPayload, AuthResponse } from '../models/auth.model';

/**
 * Interfaz estricta de sesión de usuario (Práctica de Laboratorio - Módulo 0488).
 */
export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  /** Clave constante en sessionStorage (Web Storage API) */
  private readonly STORAGE_KEY = 'DAM2_AUTH_SESSION';

  /** Signal privado con el estado reactivo de la sesión actual */
  private _currentUser = signal<UserSession | null>(this.readSessionFromStorage());

  /** Selector público de solo lectura de la sesión actual */
  public currentUser = this._currentUser.asReadonly();

  /** Selector computado reactivo de estado de autenticación */
  public isAuthenticated = computed(() => this._currentUser()?.isAuthenticated ?? false);

  /**
   * Lee y valida la sesión almacenada en sessionStorage al inicializar el servicio.
   * Si el JSON está corrupto o es inválido, limpia la clave de forma segura.
   */
  private readSessionFromStorage(): UserSession | null {
    try {
      if (typeof sessionStorage === 'undefined') {
        return null;
      }
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as UserSession;
      if (
        parsed &&
        typeof parsed.username === 'string' &&
        (parsed.role === 'admin' || parsed.role === 'user') &&
        typeof parsed.isAuthenticated === 'boolean'
      ) {
        return parsed;
      }
      sessionStorage.removeItem(this.STORAGE_KEY);
      return null;
    } catch {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(this.STORAGE_KEY);
      }
      return null;
    }
  }

  /**
   * Autenticación síncrona multinivel (Laboratorio Módulo 0488):
   * - 'admin' / '123' ➔ rol 'admin'
   * - 'operador' / '123' ➔ rol 'user'
   * - Compatibilidad extendida con cuentas corporativas demo ('admin@enterprise.io' / 'Admin123!' y 'user@enterprise.io' / 'User123!')
   *
   * @param user Nombre de usuario o correo electrónico
   * @param pass Contraseña
   * @returns true si las credenciales son válidas, false en caso contrario
   */
  login(user: string, pass: string): boolean {
    const normalizedUser = (user ?? '').trim();
    const normalizedPass = (pass ?? '').trim();

    let resolvedRole: 'admin' | 'user' | null = null;
    let resolvedUsername = normalizedUser;

    if (normalizedUser === 'admin' && normalizedPass === '123') {
      resolvedRole = 'admin';
      resolvedUsername = 'admin';
    } else if (normalizedUser === 'operador' && normalizedPass === '123') {
      resolvedRole = 'user';
      resolvedUsername = 'operador';
    } else if (normalizedUser.toLowerCase() === 'admin@enterprise.io' && normalizedPass === 'Admin123!') {
      resolvedRole = 'admin';
      resolvedUsername = 'admin';
    } else if (normalizedUser.toLowerCase() === 'user@enterprise.io' && normalizedPass === 'User123!') {
      resolvedRole = 'user';
      resolvedUsername = 'operador';
    }

    if (!resolvedRole) {
      return false;
    }

    const sessionData: UserSession = {
      username: resolvedUsername,
      role: resolvedRole,
      isAuthenticated: true,
    };

    this._currentUser.set(sessionData);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    }
    return true;
  }

  /**
   * Registro de nuevo operador (asigna rol 'user' y persiste en sessionStorage).
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    const sessionData: UserSession = {
      username: payload.name || payload.email.split('@')[0] || 'operador',
      role: 'user',
      isAuthenticated: true,
    };

    const response: AuthResponse = {
      user: sessionData,
      token: `mock-jwt-${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    return of(response).pipe(
      delay(350),
      tap((res) => {
        this._currentUser.set(res.user);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.user));
        }
      })
    );
  }

  /**
   * Cierra la sesión activa eliminando la clave de sessionStorage y limpiando el Signal reactivo.
   */
  logout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
