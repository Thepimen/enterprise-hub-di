/**
 * @file login.page.ts
 * @description Página de inicio de sesión con Formulario Reactivo.
 * Refactorizado según las directrices de Taste Skill:
 * - Sin degradados de color en títulos ni brillos artificiales
 * - Tipografía sólida en tinta (#0f172a), card plano con borde de 1px
 * - Accesos rápidos discretos en formato de píldoras operativas
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, personCircleOutline, shieldCheckmarkOutline,
  personOutline, businessOutline, serverOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoginCredentials } from '../../core/models/auth.model';

addIcons({
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, personCircleOutline, shieldCheckmarkOutline,
  personOutline, businessOutline, serverOutline
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonIcon, IonSpinner,
  ],
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <main class="login-main" id="main-content" role="main">

        <!-- Cabecera de marca sobria (Taste Skill: solid ink, no gradient headline) -->
        <header class="login-brand-header" aria-label="Presentación de EnterpriseHub">
          <div class="brand-symbol" aria-hidden="true">
            <ion-icon name="server-outline"></ion-icon>
          </div>
          <h1 class="brand-title">EnterpriseHub</h1>
          <p class="brand-subtitle">Plataforma B2B de Supervisión y Gestión de Incidencias</p>
        </header>

        <!-- Formulario de Login -->
        <section class="login-form-section" aria-label="Formulario de inicio de sesión">
          <div class="login-panel">
            <form
              [formGroup]="loginForm"
              (ngSubmit)="onSubmit()"
              novalidate
              aria-label="Formulario de inicio de sesión"
              class="form-wrapper"
            >
              <div class="form-header">
                <h2 class="form-title">Iniciar sesión</h2>
                <p class="form-instructions">Introduce tus credenciales para acceder a la consola</p>
              </div>

              <!-- Campo Email -->
              <div class="field-group">
                <label for="login-email" class="field-label">
                  Correo corporativo
                </label>
                <ion-input
                  id="login-email"
                  type="email"
                  formControlName="email"
                  placeholder="usuario@empresa.io"
                  autocomplete="email"
                  [class.input-error]="isFieldInvalid('email')"
                  aria-required="true"
                  [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
                  [attr.aria-invalid]="isFieldInvalid('email')"
                  class="enterprise-input"
                ></ion-input>
                <p
                  *ngIf="isFieldInvalid('email')"
                  id="email-error"
                  role="alert"
                  aria-live="assertive"
                  class="field-error"
                >
                  {{ getEmailError() }}
                </p>
              </div>

              <!-- Campo Password -->
              <div class="field-group">
                <div class="field-label-row">
                  <label for="login-password" class="field-label">Contraseña</label>
                </div>
                <div class="input-with-toggle">
                  <ion-input
                    id="login-password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    [class.input-error]="isFieldInvalid('password')"
                    aria-required="true"
                    [attr.aria-describedby]="isFieldInvalid('password') ? 'password-error' : null"
                    [attr.aria-invalid]="isFieldInvalid('password')"
                    class="enterprise-input"
                  ></ion-input>
                  <button
                    type="button"
                    class="toggle-pw-btn"
                    (click)="togglePassword()"
                    [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    [attr.aria-pressed]="showPassword"
                  >
                    <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'" aria-hidden="true"></ion-icon>
                  </button>
                </div>
                <p
                  *ngIf="isFieldInvalid('password')"
                  id="password-error"
                  role="alert"
                  aria-live="assertive"
                  class="field-error"
                >
                  La contraseña es obligatoria.
                </p>
              </div>

              <!-- Error de login -->
              <div
                *ngIf="loginError"
                class="login-error-banner"
                role="alert"
                aria-live="assertive"
              >
                <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
                <span>{{ loginError }}</span>
              </div>

              <!-- Botón Submit -->
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="primary-submit-btn"
                aria-label="Acceder a la consola"
              >
                <ion-spinner *ngIf="isLoading" name="crescent" aria-hidden="true"></ion-spinner>
                <span *ngIf="!isLoading">Acceder a la consola</span>
              </button>

              <!-- Enlace registro -->
              <div class="register-footer-link">
                <span>¿No dispones de credenciales?</span>
                <a routerLink="/register" aria-label="Registrar nueva cuenta">Solicitar cuenta</a>
              </div>
            </form>
          </div>

          <!-- Accesos Rápidos Demo (Taste Skill: formato técnico discreto) -->
          <div class="demo-panel" aria-label="Accesos rápidos de evaluación">
            <span class="demo-panel__title">Accesos Rápidos Demo</span>
            <div class="demo-chips">
              <button
                class="demo-chip"
                (click)="fillAdmin()"
                type="button"
                aria-label="Rellenar credenciales de administrador"
              >
                <span class="chip-role chip-role--admin">ADMIN</span>
                <span class="chip-email">admin&#64;enterprise.io</span>
              </button>
              <button
                class="demo-chip"
                (click)="fillUser()"
                type="button"
                aria-label="Rellenar credenciales de usuario técnico"
              >
                <span class="chip-role chip-role--user">OPERADOR</span>
                <span class="chip-email">user&#64;enterprise.io</span>
              </button>
            </div>
          </div>
        </section>

        <footer class="login-footer">
          <p>EnterpriseHub PWA • Evaluación 0488 • Instituto Nebrija</p>
        </footer>
      </main>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: var(--surface-ground);
    }
    .login-main {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px 24px;
    }

    .login-brand-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-symbol {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 1.35rem;
    }
    .brand-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .login-form-section {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .login-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 28px 24px;
    }
    .form-header {
      margin-bottom: 20px;
    }
    .form-title {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 3px;
      letter-spacing: -0.01em;
    }
    .form-instructions {
      font-size: 0.78125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .field-group {
      margin-bottom: 16px;
    }
    .field-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .field-label {
      font-size: 0.78125rem;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 5px;
      display: block;
    }
    .enterprise-input {
      --border-radius: 6px;
      --background: var(--surface-card);
      --padding-start: 12px;
      --padding-end: 12px;
      --color: var(--color-text-primary);
      font-size: 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      min-height: 40px;
      transition: border-color 0.15s ease;
    }
    .enterprise-input:focus-within {
      border-color: #0f172a;
    }
    .enterprise-input.input-error {
      border-color: #dc2626 !important;
    }
    .input-with-toggle {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-toggle .enterprise-input {
      flex: 1;
    }
    .toggle-pw-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      font-size: 1rem;
    }

    .field-error {
      font-size: 0.75rem;
      color: #dc2626;
      margin: 4px 0 0;
    }
    .login-error-banner {
      background: rgba(220, 38, 38, 0.06);
      border: 1px solid rgba(220, 38, 38, 0.2);
      border-radius: 6px;
      padding: 9px 12px;
      color: #dc2626;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .primary-submit-btn {
      width: 100%;
      height: 40px;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #0f172a;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 6px;
      transition: background-color 0.15s;
    }
    .primary-submit-btn:hover:not(:disabled) {
      background: #1e293b;
    }
    .primary-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .register-footer-link {
      margin-top: 18px;
      text-align: center;
      font-size: 0.78125rem;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .register-footer-link a {
      color: #2563eb;
      font-weight: 500;
      text-decoration: none;
    }
    .register-footer-link a:hover {
      text-decoration: underline;
    }

    /* Accesos Demo */
    .demo-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .demo-panel__title {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-disabled);
      margin-bottom: 8px;
    }
    .demo-chips {
      display: flex;
      gap: 8px;
    }
    .demo-chip {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
      background: var(--surface-ground);
      cursor: pointer;
      transition: all 0.12s;
    }
    .demo-chip:hover {
      background: var(--color-hover);
      border-color: var(--color-text-disabled);
    }
    .chip-role {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .chip-role--admin {
      background: #0f172a;
      color: #ffffff;
    }
    .chip-role--user {
      background: #2563eb;
      color: #ffffff;
    }
    .chip-email {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      color: var(--color-text-secondary);
    }

    .login-footer {
      margin-top: 32px;
      font-size: 0.75rem;
      color: var(--color-text-disabled);
      text-align: center;
    }
  `]
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);

  loginForm!: FormGroup;
  isLoading = false;
  loginError = '';
  showPassword = false;

  ngOnInit(): void {
    if (this.authService.currentState.isAuthenticated) {
      const role = this.authService.currentUser?.role;
      this.router.navigate([role === 'ADMIN' ? '/dashboard' : '/tickets']);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.loginError = '';

    const creds: LoginCredentials = this.loginForm.value;
    this.authService.login(creds).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notif.success(`¡Bienvenido, ${res.user.name}!`);
        const dest = res.user.role === 'ADMIN' ? '/dashboard' : '/tickets';
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = err.message ?? 'Error de autenticación';
      },
    });
  }

  fillAdmin(): void {
    this.loginForm.setValue({ email: 'admin@enterprise.io', password: 'Admin123!' });
    this.loginError = '';
  }

  fillUser(): void {
    this.loginForm.setValue({ email: 'user@enterprise.io', password: 'User123!' });
    this.loginError = '';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getEmailError(): string {
    const ctrl = this.loginForm.get('email');
    if (ctrl?.errors?.['required']) return 'El correo electrónico es obligatorio.';
    if (ctrl?.errors?.['email']) return 'Introduce un correo electrónico válido.';
    return '';
  }
}
