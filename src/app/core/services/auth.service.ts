/**
 * @file auth.service.ts
 * @description Servicio central de autenticación reactiva con Angular Signals, persistencia en
 * Web Storage API (sessionStorage: 'DAM2_AUTH_SESSION'), auditoría de eventos RBAC en vivo
 * y gestor reactivo de tema visual (Modo Oscuro NOC / Modo Claro Editorial).
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { RegisterPayload, AuthResponse } from '../models/auth.model';

/**
 * Interfaz oficial de sesión de usuario (Práctica de Laboratorio - Módulo 0488).
 */
export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

/** Entrada del registro de auditoría de seguridad en tiempo real */
export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'GUARD' | 'STORAGE' | 'SYSTEM';
  level: 'INFO' | 'WARN' | 'SUCCESS';
  message: string;
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

  /** Signal reactivo del tema visual ('dark' NOC Obsidian por defecto | 'light' Editorial) */
  public theme = signal<'dark' | 'light'>('dark');

  /** Stream reactivo de eventos de auditoría RBAC y sistema */
  private _auditLogs = signal<SecurityAuditEntry[]>([
    {
      id: 'evt-01',
      timestamp: new Date().toLocaleTimeString('es-ES'),
      type: 'STORAGE',
      level: 'INFO',
      message: 'Inicializado motor Web Storage API (sessionStorage: DAM2_AUTH_SESSION)',
    },
    {
      id: 'evt-02',
      timestamp: new Date().toLocaleTimeString('es-ES'),
      type: 'GUARD',
      level: 'SUCCESS',
      message: 'Functional Guards activas: authGuard + factoría roleGuard(admin | user)',
    },
  ]);

  public auditLogs = this._auditLogs.asReadonly();

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme());
    }
  }

  /** Alterna en vivo entre el tema Oscuro NOC y el tema Claro Editorial */
  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
    }
    this.recordAudit('SYSTEM', 'INFO', `Tema visual conmutado a modo ${next.toUpperCase()}`);
  }

  /** Registra un evento en la consola de auditoría en tiempo real */
  recordAudit(
    type: SecurityAuditEntry['type'],
    level: SecurityAuditEntry['level'],
    message: string
  ): void {
    const entry: SecurityAuditEntry = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toLocaleTimeString('es-ES'),
      type,
      level,
      message,
    };
    this._auditLogs.update((list) => [entry, ...list.slice(0, 14)]);
  }

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
   * - Compatibilidad con 'admin@enterprise.io' / 'Admin123!' y 'user@enterprise.io' / 'User123!'
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
      this.recordAudit('AUTH', 'WARN', `Intento de login fallido para usuario '${normalizedUser || 'vacío'}'`);
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
    this.recordAudit(
      'AUTH',
      'SUCCESS',
      `Signal _currentUser actualizado: { username: '${resolvedUsername}', role: '${resolvedRole}' } persistido en sessionStorage`
    );
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
        this.recordAudit('AUTH', 'SUCCESS', `Nuevo operador registrado: ${res.user.username} (rol: user)`);
      })
    );
  }

  /**
   * Cierra la sesión activa eliminando la clave de sessionStorage y limpiando el Signal reactivo.
   */
  logout(): void {
    const prevUser = this._currentUser()?.username ?? 'sesión';
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
    this._currentUser.set(null);
    this.recordAudit('AUTH', 'INFO', `Logout ejecutado para '${prevUser}'. Clave DAM2_AUTH_SESSION eliminada.`);
    this.router.navigate(['/login']);
  }
}
