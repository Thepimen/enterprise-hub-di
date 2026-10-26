/**
 * @file register.page.ts
 * @description Página de registro con validador asíncrono de email único.
 * Refactorizado según las directrices de Taste Skill:
 * - Sin degradados ni elementos con sombras pesadas
 * - Tarjeta plana con borde de 1px, tipografía sólida en tinta y barra de fortaleza discreta
 * Implementa debounceTime(300) y consulta a SqlMockService.
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors, AsyncValidatorFn
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, first } from 'rxjs/operators';
import {
  IonContent, IonInput, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, lockClosedOutline, checkmarkCircleOutline,
  closeCircleOutline, eyeOutline, eyeOffOutline, personAddOutline,
  arrowBackOutline, shieldCheckmarkOutline
} from 'ionicons/icons';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

addIcons({
  personOutline, mailOutline, lockClosedOutline, checkmarkCircleOutline,
  closeCircleOutline, eyeOutline, eyeOffOutline, personAddOutline,
  arrowBackOutline, shieldCheckmarkOutline
});

/**
 * Validador de complejidad de contraseña.
 * Requiere mínimo 8 caracteres, al menos 1 mayúscula y 1 número.
 */
function passwordStrengthValidator(ctrl: AbstractControl): ValidationErrors | null {
  const val: string = ctrl.value ?? '';
  if (!val) return null;
  const hasMin = val.length >= 8;
  const hasUpper = /[A-Z]/.test(val);
  const hasNumber = /[0-9]/.test(val);
  if (hasMin && hasUpper && hasNumber) return null;
  return { passwordStrength: { hasMin, hasUpper, hasNumber } };
}

/**
 * Validador de coincidencia de contraseñas (cross-field).
 */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (pw && confirm && pw !== confirm) return { passwordMismatch: true };
  return null;
}

/**
 * Factory de validador asíncrono de email único.
 * Utiliza debounce con timer(300) para evitar llamadas excesivas al servicio mock.
 */
function uniqueEmailValidator(sqlService: SqlMockService): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> => {
    if (!ctrl.value || !ctrl.value.includes('@')) return of(null);
    return timer(300).pipe(
      switchMap(() => sqlService.checkEmailExists(ctrl.value)),
      map((exists: boolean) => (exists ? { emailTaken: true } : null)),
      catchError(() => of(null)),
      first()
    );
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonIcon, IonSpinner,
  ],
  template: `
    <ion-content class="register-content" [fullscreen]="true">
      <main class="register-main" id="main-content" role="main">

        <!-- Cabecera de registro -->
        <header class="register-header">
          <a routerLink="/login" class="back-link" aria-label="Volver al inicio de sesión" title="Volver al inicio">
            <ion-icon name="arrow-back-outline" aria-hidden="true"></ion-icon>
          </a>
          <div class="header-symbol" aria-hidden="true">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <h1 class="register-title">Crear Cuenta</h1>
          <p class="register-desc">Registro de operador técnico en EnterpriseHub</p>
        </header>

        <section class="register-form-section" aria-label="Formulario de registro">
          <div class="register-panel">
            <form
              [formGroup]="registerForm"
              (ngSubmit)="onSubmit()"
              novalidate
              aria-label="Formulario de registro de nuevo usuario"
              class="form-wrapper"
            >
              <!-- Nombre -->
              <div class="field-group">
                <label for="reg-name" class="field-label">
                  Nombre completo
                </label>
                <ion-input
                  id="reg-name"
                  type="text"
                  formControlName="name"
                  placeholder="Ej. Carlos Martínez"
                  autocomplete="name"
                  [class.input-error]="isInvalid('name')"
                  aria-required="true"
                  [attr.aria-describedby]="isInvalid('name') ? 'name-error' : null"
                  [attr.aria-invalid]="isInvalid('name')"
                  class="enterprise-input"
                ></ion-input>
                <p *ngIf="isInvalid('name')" id="name-error" role="alert" aria-live="polite" class="field-error">
                  El nombre es obligatorio (mínimo 2 caracteres).
                </p>
              </div>

              <!-- Email con validador asíncrono -->
              <div class="field-group">
                <label for="reg-email" class="field-label">
                  Correo electrónico
                </label>
                <div class="input-status-wrapper">
                  <ion-input
                    id="reg-email"
                    type="email"
                    formControlName="email"
                    placeholder="usuario@empresa.io"
                    autocomplete="email"
                    [class.input-error]="isInvalid('email')"
                    [class.input-success]="emailOk"
                    aria-required="true"
                    [attr.aria-describedby]="'email-status'"
                    [attr.aria-invalid]="isInvalid('email')"
                    class="enterprise-input"
                  ></ion-input>
                  <!-- Indicador de validación asíncrona -->
                  <span class="async-indicator" aria-hidden="true">
                    <ion-spinner *ngIf="emailPending" name="dots" class="email-spinner"></ion-spinner>
                    <ion-icon *ngIf="emailOk" name="checkmark-circle-outline" class="email-ok-icon"></ion-icon>
                    <ion-icon *ngIf="isInvalid('email')" name="close-circle-outline" class="email-err-icon"></ion-icon>
                  </span>
                </div>
                <div id="email-status" role="alert" aria-live="polite">
                  <span *ngIf="emailPending" class="field-pending">Comprobando disponibilidad...</span>
                  <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['emailTaken']" class="field-error">
                    Este correo ya se encuentra registrado.
                  </span>
                  <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['email']" class="field-error">
                    Introduce un correo electrónico válido.
                  </span>
                  <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['required']" class="field-error">
                    El correo electrónico es obligatorio.
                  </span>
                </div>
              </div>

              <!-- Password con indicador de fortaleza -->
              <div class="field-group">
                <label for="reg-password" class="field-label">
                  Contraseña
                </label>
                <div class="input-with-toggle">
                  <ion-input
                    id="reg-password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Mínimo 8 caracteres"
                    autocomplete="new-password"
                    [class.input-error]="isInvalid('password')"
                    aria-required="true"
                    [attr.aria-describedby]="'password-strength-desc'"
                    class="enterprise-input"
                  ></ion-input>
                  <button
                    type="button"
                    class="toggle-pw-btn"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'" aria-hidden="true"></ion-icon>
                  </button>
                </div>

                <!-- Barra de fortaleza sobria -->
                <div class="strength-bar" aria-hidden="true">
                  <div [class]="'strength-level strength-' + passwordStrength"></div>
                </div>
                <div id="password-strength-desc" class="strength-checks" aria-live="polite">
                  <span [class]="pwChecks.min ? 'check ok' : 'check fail'">
                    <span class="check-pip" aria-hidden="true"></span>
                    Mínimo 8 caracteres
                  </span>
                  <span [class]="pwChecks.upper ? 'check ok' : 'check fail'">
                    <span class="check-pip" aria-hidden="true"></span>
                    Al menos una mayúscula
                  </span>
                  <span [class]="pwChecks.number ? 'check ok' : 'check fail'">
                    <span class="check-pip" aria-hidden="true"></span>
                    Al menos un número
                  </span>
                </div>
              </div>

              <!-- Confirmar Password -->
              <div class="field-group">
                <label for="reg-confirm" class="field-label">
                  Confirmar contraseña
                </label>
                <ion-input
                  id="reg-confirm"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  placeholder="Repite la contraseña"
                  autocomplete="new-password"
                  [class.input-error]="isInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
                  aria-required="true"
                  [attr.aria-describedby]="'confirm-error'"
                  class="enterprise-input"
                ></ion-input>
                <p
                  *ngIf="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched"
                  id="confirm-error" role="alert" aria-live="polite" class="field-error"
                >
                  Las contraseñas no coinciden.
                </p>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="registerForm.invalid || registerForm.pending || isLoading"
                class="primary-submit-btn"
                aria-label="Registrar cuenta en EnterpriseHub"
              >
                <ion-spinner *ngIf="isLoading" name="crescent" aria-hidden="true"></ion-spinner>
                <span *ngIf="!isLoading">Completar registro</span>
              </button>

              <div class="login-footer-link">
                <span>¿Ya dispones de cuenta?</span>
                <a routerLink="/login" aria-label="Ir al inicio de sesión">Iniciar sesión</a>
              </div>
            </form>
          </div>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .register-content { --background: var(--surface-ground); }
    .register-main {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px 16px;
    }
    .register-header {
      text-align: center;
      margin-bottom: 20px;
      position: relative;
      width: 100%;
      max-width: 400px;
    }
    .back-link {
      position: absolute;
      left: 0;
      top: 0;
      width: 34px;
      height: 34px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 1.1rem;
      transition: all 0.12s;
    }
    .back-link:hover {
      background: var(--color-hover);
      border-color: var(--color-text-disabled);
    }
    .back-link:focus-visible { outline: 2px solid var(--color-primary); }

    .header-symbol {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
      font-size: 1.25rem;
    }
    .register-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .register-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .register-form-section {
      width: 100%;
      max-width: 400px;
    }
    .register-panel {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 24px;
    }
    .field-group { margin-bottom: 15px; }
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
    .enterprise-input.input-error { border-color: #dc2626 !important; }
    .enterprise-input.input-success { border-color: #059669 !important; }

    .input-status-wrapper { position: relative; }
    .async-indicator {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      display: flex; align-items: center;
    }
    .email-spinner { width: 14px; height: 14px; }
    .email-ok-icon  { color: #059669; font-size: 1.05rem; }
    .email-err-icon { color: #dc2626; font-size: 1.05rem; }

    .input-with-toggle { position: relative; display: flex; align-items: center; }
    .input-with-toggle .enterprise-input { flex: 1; }
    .toggle-pw-btn {
      position: absolute; right: 8px;
      background: none; border: none; cursor: pointer;
      padding: 6px; color: var(--color-text-secondary);
      font-size: 1rem; display: flex; align-items: center;
    }

    .strength-bar {
      height: 3px;
      background: var(--color-border);
      border-radius: 2px;
      margin: 7px 0 6px;
      overflow: hidden;
    }
    .strength-level {
      height: 100%; border-radius: 2px;
      transition: width 0.25s ease, background-color 0.25s ease;
    }
    .strength-0 { width: 0%; }
    .strength-1 { width: 33%; background: #dc2626; }
    .strength-2 { width: 66%; background: #d97706; }
    .strength-3 { width: 100%; background: #059669; }

    .strength-checks { display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
    .check {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.71875rem;
    }
    .check-pip {
      width: 4px; height: 4px; border-radius: 50%;
      background: var(--color-text-disabled);
    }
    .check.ok { color: #059669; }
    .check.ok .check-pip { background: #059669; }
    .check.fail { color: var(--color-text-secondary); }

    .field-error { color: #dc2626; font-size: 0.75rem; margin: 4px 0 0; display: block; }
    .field-pending { color: var(--color-text-secondary); font-size: 0.75rem; font-style: italic; display: block; margin: 4px 0 0; }

    .primary-submit-btn {
      width: 100%;
      height: 40px;
      background: var(--btn-primary-bg);
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
      margin-top: 8px;
      transition: background-color 0.15s;
    }
    .primary-submit-btn:hover:not(:disabled) {
      background: #1e293b;
    }
    .primary-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .login-footer-link {
      margin-top: 16px;
      text-align: center;
      font-size: 0.78125rem;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .login-footer-link a {
      color: #2563eb;
      font-weight: 500;
      text-decoration: none;
    }
    .login-footer-link a:hover { text-decoration: underline; }
  `]
})
export class RegisterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sqlService = inject(SqlMockService);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);

  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;

  get emailPending(): boolean {
    const ctrl = this.registerForm?.get('email');
    return !!(ctrl?.pending);
  }

  get emailOk(): boolean {
    const ctrl = this.registerForm?.get('email');
    return !!(ctrl?.valid && ctrl.value && !ctrl.pending);
  }

  get pwChecks(): { min: boolean; upper: boolean; number: boolean } {
    const val: string = this.registerForm?.get('password')?.value ?? '';
    return {
      min: val.length >= 8,
      upper: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
    };
  }

  get passwordStrength(): number {
    const c = this.pwChecks;
    return [c.min, c.upper, c.number].filter(Boolean).length;
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: [
          '',
          [Validators.required, Validators.email],
          [uniqueEmailValidator(this.sqlService)],
        ],
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.registerForm.pending) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    const { name, email, password, confirmPassword } = this.registerForm.value;
    this.authService.register({ name, email, password, confirmPassword }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notif.success(`¡Cuenta creada! Bienvenido, ${res.user.username}`);
        this.router.navigate(['/user-dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.notif.error('Error al crear la cuenta. Inténtalo de nuevo.');
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.registerForm.get(field);
    return !!(ctrl && ctrl.invalid && !ctrl.pending && (ctrl.dirty || ctrl.touched));
  }
}
