/**
 * @file auth.model.ts
 * @description Modelos de dominio para autenticación, gestión de sesiones RBAC y señales reactivas.
 * Utilizado por AuthService, Functional Guards (authGuard, roleGuard) y vistas protegidas.
 */

/**
 * Interfaz oficial de sesión de usuario para Control de Acceso y Functional Guards (Módulo 0488).
 */
export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

/** Roles disponibles en el sistema */
export type UserRole = 'admin' | 'user' | 'ADMIN' | 'USER';

/** Modelo extendido de usuario autenticado */
export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

/** Payload de credenciales para login */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

/** Payload para registro de nuevo usuario */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Respuesta de la API de autenticación */
export interface AuthResponse {
  user: UserSession;
  token: string;
  expiresAt: number;
}
