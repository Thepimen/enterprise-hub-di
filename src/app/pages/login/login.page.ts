/**
 * @file login.page.ts
 * @description Página de inicio de sesión con validación de credenciales multinivel ('admin' | 'user'),
 * persistencia en sessionStorage ('DAM2_AUTH_SESSION') y botones de evaluación rápida.
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonText, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, shieldCheckmarkOutline, serverOutline, alertCircleOutline,
  keyOutline, terminalOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

addIcons({
  personOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, shieldCheckmarkOutline, serverOutline, alertCircleOutline,
  keyOutline, terminalOutline
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonIcon, IonText, IonCard, IonCardContent
  ],
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <main class="login-main" id="main-content" role="main">

        <!-- Cabecera corporativa sobria -->
        <header class="login-brand-header" aria-label="Presentación de EnterpriseHub">
          <div class="brand-symbol" aria-hidden="true">
            <ion-icon name="server-outline"></ion-icon>
          </div>
          <div class="brand-badge">MÓDULO 0488 · CONTROL DE ACCESO RBAC</div>
          <h1 class="brand-title">EnterpriseHub PWA</h1>
          <p class="brand-subtitle">Autenticación Reactiva con Signals, Web Storage API y Functional Guards</p>
        </header>

        <!-- Tarjeta de Login -->
        <section class="login-form-section" aria-label="Formulario de inicio de sesión">
          <ion-card class="login-panel">
            <ion-card-content class="login-panel-body">
              <form
                [formGroup]="loginForm"
                (ngSubmit)="onSubmit()"
                novalidate
                aria-label="Formulario de inicio de sesión"
                class="form-wrapper"
              >
                <div class="form-header">
                  <h2 class="form-title">Acceso a Consola</h2>
                  <p class="form-instructions">Introduce tus credenciales de usuario o utiliza los accesos directos del laboratorio</p>
                </div>

                <!-- Campo Usuario -->
                <div class="field-group">
                  <label for="login-username" class="field-label">
                    Usuario / Identificador
                  </label>
                  <ion-input
                    id="login-username"
                    type="text"
                    formControlName="username"
                    placeholder="admin o operador"
                    autocomplete="username"
                    [class.input-error]="isFieldInvalid('username')"
                    aria-required="true"
                    class="enterprise-input"
                  ></ion-input>
                  <ion-text color="danger" *ngIf="isFieldInvalid('username')">
                    <p class="field-error" role="alert">El nombre de usuario es obligatorio.</p>
                  </ion-text>
                </div>

                <!-- Campo Contraseña -->
                <div class="field-group">
                  <div class="field-label-row">
                    <label for="login-password" class="field-label">Contraseña</label>
                  </div>
                  <div class="input-with-toggle">
                    <ion-input
                      id="login-password"
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="password"
                      placeholder="123"
                      autocomplete="current-password"
                      [class.input-error]="isFieldInvalid('password')"
                      aria-required="true"
                      class="enterprise-input"
                    ></ion-input>
                    <button
                      type="button"
                      class="toggle-pw-btn"
                      (click)="togglePassword()"
                      [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    >
                      <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'" aria-hidden="true"></ion-icon>
                    </button>
                  </div>
                  <ion-text color="danger" *ngIf="isFieldInvalid('password')">
                    <p class="field-error" role="alert">La contraseña es obligatoria.</p>
                  </ion-text>
                </div>

                <!-- Mensaje de error de autenticación con ion-text color="danger" -->
                <div
                  *ngIf="loginError"
                  class="login-error-banner"
                  role="alert"
                  aria-live="assertive"
                >
                  <ion-icon name="alert-circle-outline" color="danger" aria-hidden="true"></ion-icon>
                  <ion-text color="danger">
                    <span class="error-msg-text">{{ loginError }}</span>
                  </ion-text>
                </div>

                <!-- Botón Principal de Envío (Alto contraste garantizado) -->
                <button
                  type="submit"
                  class="primary-submit-btn"
                  aria-label="Iniciar sesión en EnterpriseHub"
                >
                  <ion-icon name="log-in-outline" aria-hidden="true"></ion-icon>
                  <span>Iniciar Sesión</span>
                </button>

                <!-- Enlace a Registro -->
                <div class="register-footer-link">
                  <span>¿Nuevo operador en turno?</span>
                  <a routerLink="/register">Registrar cuenta</a>
                </div>
              </form>
            </ion-card-content>
          </ion-card>

          <!-- Botones de Acceso Rápido para Evaluación Inmediata -->
          <div class="demo-panel" aria-label="Accesos rápidos de laboratorio">
            <div class="demo-panel-header">
              <ion-icon name="terminal-outline"></ion-icon>
              <span>EVALUACIÓN RÁPIDA DE ROLES (LABORATORIO)</span>
            </div>
            <div class="demo-chips">
              <button
                id="btn-quick-admin"
                class="demo-chip demo-chip--admin"
                (click)="quickLogin('admin', '123')"
                type="button"
                aria-label="Iniciar como Admin (admin / 123)"
              >
                <span class="chip-badge chip-badge--admin">ROL ADMIN</span>
                <span class="chip-label">Admin (admin / 123)</span>
                <span class="chip-route">➔ /admin</span>
              </button>

              <button
                id="btn-quick-operador"
                class="demo-chip demo-chip--user"
                (click)="quickLogin('operador', '123')"
                type="button"
                aria-label="Iniciar como Operador (operador / 123)"
              >
                <span class="chip-badge chip-badge--user">ROL USER</span>
                <span class="chip-label">Operador (operador / 123)</span>
                <span class="chip-route">➔ /user-dashboard</span>
              </button>
            </div>
          </div>
        </section>

      </main>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: var(--surface-ground);
    }
    .login-main {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      max-width: 460px;
      margin: 0 auto;
    }

    .login-brand-header {
      text-align: center;
      margin-bottom: 22px;
    }
    .brand-symbol {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: var(--btn-primary-bg);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .brand-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.025em;
      margin: 0 0 6px;
    }
    .brand-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.45;
    }

    .login-form-section {
      width: 100%;
    }
    .login-panel {
      margin: 0;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px !important;
    }
    .login-panel-body {
      padding: 24px;
    }
    .form-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-header {
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 12px;
    }
    .form-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .form-instructions {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .enterprise-input {
      --background: var(--surface-ground);
      --color: var(--color-text-primary);
      --placeholder-color: var(--color-text-disabled);
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 10px;
      --padding-bottom: 10px;
      border: 1px solid var(--color-border-strong);
      border-radius: 8px;
      font-size: 0.875rem;
      min-height: 42px;
    }
    .enterprise-input.input-error {
      border-color: var(--color-danger);
    }

    .input-with-toggle {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-toggle .enterprise-input {
      flex: 1;
      --padding-end: 42px;
    }
    .toggle-pw-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      padding: 6px;
      display: flex;
      align-items: center;
      font-size: 1.1rem;
      z-index: 2;
    }

    .field-error {
      font-size: 0.75rem;
      font-weight: 500;
      margin: 2px 0 0;
    }

    .login-error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .login-error-banner ion-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .error-msg-text {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* Botón primario con contraste garantizado (#2563eb fondo / #ffffff texto) */
    .primary-submit-btn {
      width: 100%;
      height: 44px;
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border: 1px solid var(--btn-primary-border);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .primary-submit-btn:hover {
      background: var(--btn-primary-bg-hover);
    }

    .register-footer-link {
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      display: flex;
      justify-content: center;
      gap: 6px;
      padding-top: 4px;
    }
    .register-footer-link a {
      color: var(--color-primary-light);
      font-weight: 600;
      text-decoration: none;
    }
    .register-footer-link a:hover {
      text-decoration: underline;
    }

    /* Panel de Evaluación Rápida */
    .demo-panel {
      margin-top: 16px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .demo-panel-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .demo-chips {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border-strong);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      color: var(--color-text-primary);
    }
    .demo-chip:hover {
      border-color: var(--color-primary-light);
      background: var(--color-hover);
    }
    .chip-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 7px;
      border-radius: 4px;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .chip-badge--admin {
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .chip-badge--user {
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .chip-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      flex: 1;
    }
    .chip-route {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--color-text-secondary);
    }
  `],
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  loginForm!: FormGroup;
  showPassword = false;
  loginError: string | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    // Si ya tiene sesión activa, redirige según su rol
    if (this.authService.isAuthenticated()) {
      const role = this.authService.currentUser()?.role;
      this.router.navigate([role === 'admin' ? '/admin' : '/user-dashboard']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Rellena el formulario y ejecuta el login con las credenciales de laboratorio
   */
  quickLogin(user: string, pass: string): void {
    this.loginForm.patchValue({ username: user, password: pass });
    this.loginError = null;
    this.executeLogin(user, pass);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginError = 'Completa el usuario y la contraseña para continuar.';
      return;
    }
    const { username, password } = this.loginForm.value;
    this.executeLogin(username, password);
  }

  private executeLogin(user: string, pass: string): void {
    const ok = this.authService.login(user, pass);

    if (!ok) {
      this.loginError = 'Credenciales inválidas. Usa admin / 123 o operador / 123.';
      this.notify.error(this.loginError);
      return;
    }

    this.loginError = null;
    const session = this.authService.currentUser();
    this.notify.success(`Sesión iniciada: ${session?.username} (${session?.role})`);

    // Si hay returnUrl por redirección de authGuard, navega a ella
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const target = session?.role === 'admin' ? '/admin' : '/user-dashboard';
    this.router.navigate([target]);
  }
}
