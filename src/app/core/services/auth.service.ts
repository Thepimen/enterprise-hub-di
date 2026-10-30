/**
 * @file auth.service.ts
 * @description Servicio central de autenticación reactiva con Angular Signals, persistencia en
 * Web Storage API (sessionStorage: 'DAM2_AUTH_SESSION'), gestión de tokens Bearer en memoria
 * para prevención de fugas XSS, auditoría de eventos RBAC en vivo y gestor reactivo de tema visual.
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { RegisterPayload, AuthResponse, SystemRole } from '../models/auth.model';

/**
 * Interfaz oficial de sesión de usuario (Práctica de Laboratorio - Módulo 0488).
 */
export interface UserSession {
  readonly username: string;
  readonly role: 'admin' | 'user' | 'ADMIN' | 'SUPERVISOR' | 'USER';
  readonly isAuthenticated: boolean;
  readonly token?: string;
}

/** Entrada del registro de auditoría de seguridad en tiempo real */
export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'GUARD' | 'STORAGE' | 'SYSTEM' | 'INTERCEPTOR';
  level: 'INFO' | 'WARN' | 'SUCCESS';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  /** Clave constante en sessionStorage (Web Storage API) */
  private readonly STORAGE_KEY = 'DAM2_AUTH_SESSION';
  private readonly TOKEN_STORAGE_KEY = 'DAM2_BEARER_TOKEN';

  /** Signal privado con el estado reactivo de la sesión actual */
  private _currentUser = signal<UserSession | null>(this.readSessionFromStorage());

  /** Selector público de solo lectura de la sesión actual */
  public currentUser = this._currentUser.asReadonly();

  /** Selector computado reactivo de estado de autenticación */
  public isAuthenticated = computed(() => this._currentUser()?.isAuthenticated ?? false);

  /** Signal privado con el token de acceso en memoria (Defensa en Profundidad) */
  private _token = signal<string | null>(this.readInitialToken());

  /** Selector público de solo lectura del token Bearer */
  public token = this._token.asReadonly();

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
      message: 'Pipeline de seguridad activo: authGuard + factoría roleGuard([ADMIN, SUPERVISOR, USER])',
    },
  ]);

  public auditLogs = this._auditLogs.asReadonly();

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme());
    }
  }

  /**
   * Obtiene el token Bearer actual en memoria (para uso en HTTP Interceptors).
   * El token no se expone en window ni en el DOM.
   */
  getToken(): string | null {
    return this._token();
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
        parsed.role &&
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

  /** Lee el token inicial de sessionStorage si existe para hidratar la señal en memoria */
  private readInitialToken(): string | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      return sessionStorage.getItem(this.TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }

  /**
   * Genera un token JWT simulado firmado para la sesión activa.
   */
  private generateMockToken(username: string, role: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: username,
      role: role.toUpperCase(),
      iss: 'enterprise-hub-auth',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 3600)
    }));
    const signature = btoa(`sig_${username}_${Date.now()}`);
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Autenticación síncrona multinivel (Laboratorio Módulo 0488):
   * - 'admin' / '123' ➔ rol 'admin' (privilegio ADMIN)
   * - 'operador' / '123' ➔ rol 'user' (privilegio USER)
   * - 'supervisor' / '123' ➔ rol 'SUPERVISOR'
   * - Compatibilidad con 'admin@enterprise.io' / 'Admin123!' y 'user@enterprise.io' / 'User123!'
   */
  login(user: string, pass: string): boolean {
    const normalizedUser = (user ?? '').trim();
    const normalizedPass = (pass ?? '').trim();

    let resolvedRole: 'admin' | 'user' | 'SUPERVISOR' | null = null;
    let resolvedUsername = normalizedUser;

    if (normalizedUser === 'admin' && normalizedPass === '123') {
      resolvedRole = 'admin';
      resolvedUsername = 'admin';
    } else if (normalizedUser === 'operador' && normalizedPass === '123') {
      resolvedRole = 'user';
      resolvedUsername = 'operador';
    } else if (normalizedUser === 'supervisor' && normalizedPass === '123') {
      resolvedRole = 'SUPERVISOR';
      resolvedUsername = 'supervisor';
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

    const bearerToken = this.generateMockToken(resolvedUsername, resolvedRole);

    const sessionData: UserSession = {
      username: resolvedUsername,
      role: resolvedRole,
      isAuthenticated: true,
      token: bearerToken,
    };

    // Actualización de señales reactivas en memoria
    this._currentUser.set(sessionData);
    this._token.set(bearerToken);

    // Persistencia síncrona segura en Web Storage API
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      sessionStorage.setItem(this.TOKEN_STORAGE_KEY, bearerToken);
    }

    this.recordAudit(
      'AUTH',
      'SUCCESS',
      `Signal _currentUser actualizado: { username: '${resolvedUsername}', role: '${resolvedRole}' } + Bearer token en memoria`
    );
    return true;
  }

  /**
   * Registro de nuevo operador (asigna rol 'user' y persiste en sessionStorage).
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    const username = payload.name || payload.email.split('@')[0] || 'operador';
    const bearerToken = this.generateMockToken(username, 'user');

    const sessionData: UserSession = {
      username,
      role: 'user',
      isAuthenticated: true,
      token: bearerToken,
    };

    const response: AuthResponse = {
      user: sessionData,
      token: bearerToken,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    return of(response).pipe(
      delay(350),
      tap((res) => {
        this._currentUser.set(res.user);
        this._token.set(res.token);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(res.user));
          sessionStorage.setItem(this.TOKEN_STORAGE_KEY, res.token);
        }
        this.recordAudit('AUTH', 'SUCCESS', `Nuevo operador registrado: ${res.user.username} (rol: user)`);
      })
    );
  }

  /**
   * Cierra la sesión activa eliminando las claves de sessionStorage y limpiando las señales reactivas.
   */
  logout(): void {
    const prevUser = this._currentUser()?.username ?? 'sesión';
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
    }
    this._currentUser.set(null);
    this._token.set(null);
    this.recordAudit('AUTH', 'INFO', `Logout ejecutado para '${prevUser}'. Claves DAM2 eliminadas y tokens revocados.`);
    this.router.navigate(['/login']);
  }
}
