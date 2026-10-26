/**
 * @file auth.service.ts
 * @description Servicio de autenticación con gestión de roles y persistencia en localStorage.
 * Implementa BehaviorSubject para estado reactivo global de sesión.
 */
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import {
  User,
  UserRole,
  LoginCredentials,
  RegisterPayload,
  AuthResponse,
  AuthState
} from '../models/auth.model';

/** Clave de almacenamiento en localStorage */
const STORAGE_KEY = 'enterprise_hub_auth';

/** Usuarios preconfigurados del sistema */
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'usr-001',
    name: 'Administrador Sistema',
    email: 'admin@enterprise.io',
    password: 'Admin123!',
    role: 'ADMIN',
    avatar: 'person-circle-outline',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: 'usr-002',
    name: 'Usuario Operaciones',
    email: 'user@enterprise.io',
    password: 'User123!',
    role: 'USER',
    avatar: 'person-outline',
    createdAt: new Date('2024-03-15'),
    lastLogin: new Date(),
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  /** Estado inicial de autenticación */
  private readonly initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  /** BehaviorSubject con el estado global de autenticación */
  private readonly authState$ = new BehaviorSubject<AuthState>(this.initialState);

  /** BehaviorSubject reactivo con el usuario actual de sesión (requisito RA 1 y RA 2) */
  readonly user$ = new BehaviorSubject<User | null>(null);

  /** Observable público del estado (solo lectura) */
  readonly state$ = this.authState$.asObservable();

  /** Observable del usuario actual */
  readonly currentUser$ = this.user$.asObservable();

  /** Observable del estado de carga */
  readonly isLoading$ = this.authState$.pipe(map((s) => s.loading));

  constructor() {
    this.restoreSession();
  }

  /** Restaura la sesión persistida en localStorage al recargar */
  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthResponse = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          const restoredUser: User = { ...parsed.user, createdAt: new Date(parsed.user.createdAt) };
          this.user$.next(restoredUser);
          this.authState$.next({
            user: restoredUser,
            token: parsed.token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
          this.user$.next(null);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Obtiene el estado actual de autenticación (snapshot) */
  get currentState(): AuthState {
    return this.authState$.getValue();
  }

  /** Obtiene el usuario actual (snapshot) */
  get currentUser(): User | null {
    return this.authState$.getValue().user;
  }

  /** Verifica si el usuario tiene un rol específico */
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Realiza el login con validación mock y retraso simulado de red (400ms).
   * @param credentials - Email y contraseña del usuario
   * @returns Observable con la respuesta de autenticación
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.authState$.next({ ...this.currentState, loading: true, error: null });

    const found = MOCK_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!found) {
      return throwError(() => new Error('Credenciales incorrectas. Verifique email y contraseña.')).pipe(
        tap(() => {
          this.authState$.next({
            ...this.currentState,
            loading: false,
            error: 'Credenciales incorrectas.',
          });
        })
      );
    }

    const { password: _pw, ...userWithoutPassword } = found;
    const response: AuthResponse = {
      user: { ...userWithoutPassword, lastLogin: new Date() },
      token: `mock-jwt-${userWithoutPassword.id}-${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
    };

    return of(response).pipe(
      delay(400),
      tap((res) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this.user$.next(res.user);
        this.authState$.next({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      })
    );
  }

  /**
   * Registra un nuevo usuario (mock - no persiste entre sesiones en esta demo).
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    this.authState$.next({ ...this.currentState, loading: true, error: null });

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: 'USER',
      avatar: 'person-outline',
      createdAt: new Date(),
    };

    const response: AuthResponse = {
      user: newUser,
      token: `mock-jwt-${newUser.id}-${Date.now()}`,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    return of(response).pipe(
      delay(600),
      tap((res) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this.user$.next(res.user);
        this.authState$.next({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      })
    );
  }

  /** Cierra la sesión y redirige al login */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user$.next(null);
    this.authState$.next(this.initialState);
    this.router.navigate(['/login']);
  }
}
