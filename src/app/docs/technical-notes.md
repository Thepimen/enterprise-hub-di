# Documentación Técnica: Control de Acceso RBAC, Signals y Functional Guards (Módulo 0488)

Este documento describe la arquitectura e implementación técnica de **EnterpriseHub PWA** para la práctica de laboratorio de **Control de Acceso y Functional Guards** del módulo **0488 - Desarrollo de Interfaces (2º DAM)**, desarrollada con **Ionic 8** y **Angular Standalone**.

---

## 1. Modelo de Datos y Gestión de Estado Reactivo (`AuthService`)

Archivo: [`src/app/core/services/auth.service.ts`](../core/services/auth.service.ts)

### 1.1. Interfaz `UserSession`
```typescript
export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}
```

### 1.2. Estado Reactivo con Angular Signals
En lugar de depender de flujos imperativos dispersos, el estado de autenticación se centraliza mediante **Angular Signals**:
- `private _currentUser = signal<UserSession | null>(this.readSessionFromStorage());`
- `public currentUser = this._currentUser.asReadonly();`
- `public isAuthenticated = computed(() => this._currentUser()?.isAuthenticated ?? false);`

### 1.3. Persistencia Segura en Web Storage API (`sessionStorage`)
- **Clave constante:** `private readonly STORAGE_KEY = 'DAM2_AUTH_SESSION';`
- **`readSessionFromStorage()`:** Recupera el JSON almacenado en `sessionStorage`, valida su estructura dentro de un bloque `try/catch` y elimina automáticamente la clave si el contenido está corrupto.
- **Validación Multinivel (`login`):**
  - `admin` / `123` ➔ Asigna `role: 'admin'`.
  - `operador` / `123` ➔ Asigna `role: 'user'`.
  - Al autenticar con éxito, actualiza `this._currentUser.set(sessionData)` y persiste en `sessionStorage`.
- **Cierre de Sesión (`logout`):**
  - Elimina `DAM2_AUTH_SESSION` de `sessionStorage`, resetea el signal `this._currentUser.set(null)` y redirige a `/login`.

---

## 2. Functional Guards y Factoría de Roles (`src/app/core/guards/`)

### 2.1. Guarda de Autenticación ([`auth.guard.ts`](../core/guards/auth.guard.ts))
Implementa `CanActivateFn` utilizando inyección funcional (`inject()`):
```typescript
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

### 2.2. Factoría de Control de Acceso Granular ([`role.guard.ts`](../core/guards/role.guard.ts))
Implementa la factoría `roleGuard(allowedRole: 'admin' | 'user'): CanActivateFn`:
```typescript
export const roleGuard = (allowedRole: 'admin' | 'user'): CanActivateFn => {
  return (_route, _state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const session = authService.currentUser();
    if (session?.role === allowedRole) {
      return true;
    }

    if (session?.role === 'admin') {
      return router.createUrlTree(['/admin']);
    }
    return router.createUrlTree(['/user-dashboard']);
  };
};
```

---

## 3. Enrutamiento Modular y Lazy Loading (`app.routes.ts`)

Las rutas protegen cada vista combinando `authGuard` y `roleGuard` con carga perezosa (`loadComponent`):
- `/login` ➔ `LoginPage` (Formulario reactivo + botones rápidos `admin / 123` y `operador / 123` + errores con `ion-text color="danger"`).
- `/admin` ➔ `AdminPage` protegida con `canActivate: [authGuard, roleGuard('admin')]`.
- `/user-dashboard` ➔ `UserDashboardPage` protegida con `canActivate: [authGuard, roleGuard('user')]`.
- `/tickets` y `/help` ➔ Protegidas con `canActivate: [authGuard]`.
