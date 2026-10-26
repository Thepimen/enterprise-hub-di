/**
 * @file login.page.ts
 * @description Página de inicio de sesión con Formulario Reactivo.
 * Valida credenciales en tiempo real y muestra accesos rápidos de prueba.
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  IonCard, IonCardContent
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
    IonContent, IonInput, IonButton, IonIcon, IonSpinner,
    IonCard, IonCardContent,
  ],
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <main class="login-main" id="main-content" role="main">

        <!-- Sección Hero -->
        <section class="login-hero" aria-label="Presentación de EnterpriseHub">
          <div class="hero-logo" aria-hidden="true">
            <ion-icon name="server-outline"></ion-icon>
          </div>
          <h1 class="hero-title">EnterpriseHub</h1>
          <p class="hero-subtitle">Sistema de Gestión Multiplataforma B2B</p>
          <p class="hero-desc">Monitorización de infraestructura y tickets técnicos en tiempo real</p>
        </section>

        <!-- Formulario de Login -->
        <section class="login-form-section" aria-label="Formulario de inicio de sesión">
          <ion-card class="login-card">
            <ion-card-content>
              <form
                [formGroup]="loginForm"
                (ngSubmit)="onSubmit()"
                novalidate
                aria-label="Formulario de inicio de sesión"
              >
                <h2 class="form-title">Iniciar Sesión</h2>

                <!-- Campo Email -->
                <div class="field-group">
                  <label for="login-email" class="field-label">
                    <ion-icon name="mail-outline" aria-hidden="true"></ion-icon>
                    Correo electrónico
                  </label>
                  <ion-input
                    id="login-email"
                    type="email"
                    formControlName="email"
                    placeholder="correo@empresa.io"
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
                  <label for="login-password" class="field-label">
                    <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
                    Contraseña
                  </label>
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
                  {{ loginError }}
                </div>

                <!-- Botón Submit -->
                <ion-button
                  type="submit"
                  expand="block"
                  [disabled]="loginForm.invalid || isLoading"
                  class="submit-btn"
                  aria-label="Iniciar sesión en EnterpriseHub"
                >
                  <ion-spinner *ngIf="isLoading" name="crescent" aria-hidden="true"></ion-spinner>
                  <ion-icon *ngIf="!isLoading" name="log-in-outline" slot="start" aria-hidden="true"></ion-icon>
                  {{ isLoading ? 'Autenticando...' : 'Iniciar Sesión' }}
                </ion-button>

                <!-- Enlace registro -->
                <p class="register-link">
                  ¿No tienes cuenta?
                  <a routerLink="/register" aria-label="Ir a la página de registro">Crear cuenta</a>
                </p>
              </form>
            </ion-card-content>
          </ion-card>

          <!-- Credenciales de prueba -->
          <section class="demo-credentials" aria-label="Credenciales de prueba para demostración">
            <h3 class="demo-title">
              <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
              Accesos Rápidos Demo
            </h3>
            <div class="demo-grid">
              <button
                class="demo-btn demo-btn--admin"
                (click)="fillAdmin()"
                type="button"
                aria-label="Rellenar credenciales de administrador para prueba rápida"
              >
                <div class="demo-btn__icon" aria-hidden="true">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                </div>
                <div class="demo-btn__info">
                  <span class="demo-btn__role">ADMIN</span>
                  <span class="demo-btn__email">admin@enterprise.io</span>
                  <span class="demo-btn__pass">Admin123!</span>
                </div>
              </button>
              <button
                class="demo-btn demo-btn--user"
                (click)="fillUser()"
                type="button"
                aria-label="Rellenar credenciales de usuario para prueba rápida"
              >
                <div class="demo-btn__icon" aria-hidden="true">
                  <ion-icon name="person-outline"></ion-icon>
                </div>
                <div class="demo-btn__info">
                  <span class="demo-btn__role">USER</span>
                  <span class="demo-btn__email">user@enterprise.io</span>
                  <span class="demo-btn__pass">User123!</span>
                </div>
              </button>
            </div>
          </section>
        </section>

        <footer class="login-footer">
          <p>EnterpriseHub PWA &copy; 2025 | DAM2 Desarrollo de Interfaces | Universidad Nebrija</p>
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
      justify-content: flex-start;
      padding: 24px 16px 40px;
      gap: 0;
    }
    .login-hero {
      text-align: center;
      padding: 40px 0 28px;
    }
    .hero-logo {
      width: 80px; height: 80px;
      border-radius: 24px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 12px 32px rgba(25,42,86,0.3);
    }
    .hero-logo ion-icon { font-size: 2.4rem; color: white; }
    .hero-title {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 6px;
    }
    .hero-subtitle {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .hero-desc {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .login-form-section {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .login-card {
      border-radius: 20px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
      border: 1px solid var(--color-border);
    }
    .form-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 20px;
    }
    .field-group { margin-bottom: 16px; }
    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .enterprise-input {
      --border-radius: 10px;
      --border-color: var(--color-border);
      --background: var(--surface-ground);
      --padding-start: 14px;
      --padding-end: 14px;
      --color: var(--color-text-primary);
      font-size: 0.95rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
    }
    .enterprise-input.input-error {
      --border-color: var(--ion-color-danger);
      border-color: var(--ion-color-danger);
    }
    .input-with-toggle { position: relative; display: flex; align-items: center; }
    .input-with-toggle .enterprise-input { flex: 1; }
    .toggle-pw-btn {
      position: absolute; right: 8px;
      background: none; border: none;
      cursor: pointer; padding: 6px;
      color: var(--color-text-secondary);
      border-radius: 6px;
      font-size: 1.1rem;
      display: flex; align-items: center;
    }
    .toggle-pw-btn:focus-visible { outline: 2px solid var(--color-primary); }
    .field-error {
      font-size: 0.78rem;
      color: var(--ion-color-danger);
      margin: 4px 0 0 2px;
      display: flex; align-items: center; gap: 4px;
    }
    .login-error-banner {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      padding: 12px 16px;
      color: #dc2626;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .submit-btn {
      --border-radius: 12px;
      margin-top: 8px;
      font-weight: 700;
      font-size: 1rem;
      height: 50px;
    }
    .register-link {
      text-align: center;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin: 16px 0 0;
    }
    .register-link a {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .register-link a:hover { text-decoration: underline; }
    .register-link a:focus-visible { outline: 2px solid var(--color-primary); border-radius: 3px; }

    /* Demo credentials */
    .demo-credentials {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 16px;
    }
    .demo-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      display: flex; align-items: center; gap: 6px;
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .demo-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }
    .demo-btn--admin {
      background: rgba(25,42,86,0.07);
      border-color: rgba(25,42,86,0.15);
    }
    .demo-btn--admin:hover { background: rgba(25,42,86,0.12); transform: translateY(-1px); }
    .demo-btn--user {
      background: rgba(6,182,212,0.07);
      border-color: rgba(6,182,212,0.15);
    }
    .demo-btn--user:hover { background: rgba(6,182,212,0.12); transform: translateY(-1px); }
    .demo-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    .demo-btn__icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
    }
    .demo-btn--admin .demo-btn__icon { background: rgba(25,42,86,0.15); color: var(--color-primary); }
    .demo-btn--user  .demo-btn__icon { background: rgba(6,182,212,0.15); color: #0891b2; }
    .demo-btn__info { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
    .demo-btn__role {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-secondary);
    }
    .demo-btn__email {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .demo-btn__pass {
      font-size: 0.72rem;
      font-family: monospace;
      color: var(--color-text-secondary);
    }
    .login-footer {
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      text-align: center;
    }
    @media (max-width: 400px) {
      .demo-grid { grid-template-columns: 1fr; }
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
    // Si ya está autenticado, redirige
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
