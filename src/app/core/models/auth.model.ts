/**
 * @file auth.model.ts
 * @description Modelos de dominio para autenticación y gestión de usuarios.
 * Utilizado por AuthService, Guards y componentes de Login/Register.
 */

/** Roles disponibles en el sistema */
export type UserRole = 'ADMIN' | 'USER';

/** Modelo principal de usuario autenticado */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

/** Payload de credenciales para login */
export interface LoginCredentials {
  email: string;
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
  user: User;
  token: string;
  expiresAt: number;
}

/** Estado global de autenticación almacenado en BehaviorSubject */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
