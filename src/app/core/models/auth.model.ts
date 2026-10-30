/**
 * @file auth.model.ts
 * @description Modelos de dominio para autenticación, gestión de sesiones RBAC y señales reactivas.
 * Utilizado por AuthService, Functional Guards (authGuard, roleGuard) y vistas protegidas.
 */

/** Roles disponibles en el sistema con soporte granular (ADMIN, SUPERVISOR, USER) */
export type SystemRole = 'ADMIN' | 'SUPERVISOR' | 'USER' | 'admin' | 'user';

/**
 * Interfaz oficial de sesión de usuario para Control de Acceso y Functional Guards (Módulo 0488).
 */
export interface UserSession {
  readonly username: string;
  readonly role: 'admin' | 'user' | 'ADMIN' | 'SUPERVISOR' | 'USER';
  readonly isAuthenticated: boolean;
  readonly token?: string;
}

/** Roles legados o extendidos */
export type UserRole = SystemRole;

/** Modelo extendido de usuario autenticado */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatar?: string;
  readonly createdAt: Date;
  readonly lastLogin?: Date;
}

/** Payload inmutable de credenciales para login */
export interface LoginCredentials {
  readonly username?: string;
  readonly email?: string;
  readonly password: string;
}

/** Payload inmutable para registro de nuevo usuario */
export interface RegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

/** Respuesta de la API de autenticación con token Bearer */
export interface AuthResponse {
  readonly user: UserSession;
  readonly token: string;
  readonly expiresAt: number;
}
