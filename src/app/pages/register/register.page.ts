/**
 * @file register.page.ts
 * @description Página de registro con validador asíncrono de email único.
 * Implementa debounceTime(300) y consulta a SqlMockService para comprobar
 * si el email ya existe en el sistema.
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
  IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  IonCard, IonCardContent
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
    IonContent, IonInput, IonButton, IonIcon, IonSpinner,
    IonCard, IonCardContent,
  ],
  template: `
    <ion-content class="register-content" [fullscreen]="true">
      <main class="register-main" id="main-content" role="main">

        <!-- Header -->
        <header class="register-header">
          <a routerLink="/login" class="back-link" aria-label="Volver al inicio de sesión">
            <ion-icon name="arrow-back-outline" aria-hidden="true"></ion-icon>
          </a>
          <div class="header-brand" aria-hidden="true">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <h1 class="register-title">Crear Cuenta</h1>
          <p class="register-desc">Únete a EnterpriseHub</p>
        </header>

        <section aria-label="Formulario de registro">
          <ion-card class="register-card">
            <ion-card-content>
              <form
                [formGroup]="registerForm"
                (ngSubmit)="onSubmit()"
                novalidate
                aria-label="Formulario de registro de nuevo usuario"
              >

                <!-- Nombre -->
                <div class="field-group">
                  <label for="reg-name" class="field-label">
                    <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
                    Nombre completo *
                  </label>
                  <ion-input
                    id="reg-name"
                    type="text"
                    formControlName="name"
                    placeholder="Tu nombre completo"
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
                    <ion-icon name="mail-outline" aria-hidden="true"></ion-icon>
                    Correo electrónico *
                  </label>
                  <div class="input-status-wrapper">
                    <ion-input
                      id="reg-email"
                      type="email"
                      formControlName="email"
                      placeholder="correo@empresa.io"
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
                  <p id="email-status" role="alert" aria-live="polite">
                    <span *ngIf="emailPending" class="field-pending">Verificando disponibilidad del correo...</span>
                    <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['emailTaken']" class="field-error">
                      Este correo ya está registrado en el sistema.
                    </span>
                    <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['email']" class="field-error">
                      Introduce un correo electrónico válido.
                    </span>
                    <span *ngIf="isInvalid('email') && registerForm.get('email')?.errors?.['required']" class="field-error">
                      El correo electrónico es obligatorio.
                    </span>
                  </p>
                </div>

                <!-- Password con indicador de fortaleza -->
                <div class="field-group">
                  <label for="reg-password" class="field-label">
                    <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
                    Contraseña *
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

                  <!-- Barra de fortaleza -->
                  <div class="strength-bar" aria-hidden="true">
                    <div [class]="'strength-level strength-' + passwordStrength"></div>
                  </div>
                  <div id="password-strength-desc" class="strength-checks" aria-live="polite">
                    <span [class]="pwChecks.min ? 'check ok' : 'check fail'">
                      <ion-icon [name]="pwChecks.min ? 'checkmark-circle-outline' : 'close-circle-outline'" aria-hidden="true"></ion-icon>
                      Mínimo 8 caracteres
                    </span>
                    <span [class]="pwChecks.upper ? 'check ok' : 'check fail'">
                      <ion-icon [name]="pwChecks.upper ? 'checkmark-circle-outline' : 'close-circle-outline'" aria-hidden="true"></ion-icon>
                      Al menos una mayúscula
                    </span>
                    <span [class]="pwChecks.number ? 'check ok' : 'check fail'">
                      <ion-icon [name]="pwChecks.number ? 'checkmark-circle-outline' : 'close-circle-outline'" aria-hidden="true"></ion-icon>
                      Al menos un número
                    </span>
                  </div>
                </div>

                <!-- Confirmar Password -->
                <div class="field-group">
                  <label for="reg-confirm" class="field-label">
                    <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
                    Confirmar contraseña *
                  </label>
                  <ion-input
                    id="reg-confirm"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    placeholder="Repite tu contraseña"
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
                <ion-button
                  type="submit"
                  expand="block"
                  [disabled]="registerForm.invalid || registerForm.pending || isLoading"
                  class="submit-btn"
                  aria-label="Crear cuenta en EnterpriseHub"
                >
                  <ion-spinner *ngIf="isLoading" name="crescent" aria-hidden="true"></ion-spinner>
                  <ion-icon *ngIf="!isLoading" name="person-add-outline" slot="start" aria-hidden="true"></ion-icon>
                  {{ isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
                </ion-button>

                <p class="login-link">
                  ¿Ya tienes cuenta?
                  <a routerLink="/login" aria-label="Ir al inicio de sesión">Iniciar sesión</a>
                </p>
              </form>
            </ion-card-content>
          </ion-card>
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
      padding: 24px 16px 40px;
      gap: 0;
    }
    .register-header {
      text-align: center;
      padding: 32px 0 24px;
      position: relative;
      width: 100%;
      max-width: 420px;
    }
    .back-link {
      position: absolute;
      left: 0; top: 32px;
      width: 40px; height: 40px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 1.2rem;
      transition: all 0.15s;
    }
    .back-link:hover { background: var(--color-hover); }
    .back-link:focus-visible { outline: 2px solid var(--color-primary); }
    .header-brand {
      width: 64px; height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      font-size: 1.8rem;
      color: white;
    }
    .register-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .register-desc {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .register-card {
      width: 100%;
      max-width: 420px;
      border-radius: 20px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
      border: 1px solid var(--color-border);
    }
    .field-group { margin-bottom: 18px; }
    .field-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .enterprise-input {
      --border-radius: 10px;
      --border-color: var(--color-border);
      --background: var(--surface-ground);
      --padding-start: 14px; --padding-end: 14px;
      --color: var(--color-text-primary);
      border: 1px solid var(--color-border); border-radius: 10px;
    }
    .enterprise-input.input-error { border-color: var(--ion-color-danger) !important; }
    .enterprise-input.input-success { border-color: #10b981 !important; }
    .input-status-wrapper { position: relative; }
    .async-indicator {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      display: flex; align-items: center;
    }
    .email-spinner { width: 16px; height: 16px; }
    .email-ok-icon  { color: #10b981; font-size: 1.1rem; }
    .email-err-icon { color: var(--ion-color-danger); font-size: 1.1rem; }
    .input-with-toggle { position: relative; display: flex; align-items: center; }
    .input-with-toggle .enterprise-input { flex: 1; }
    .toggle-pw-btn {
      position: absolute; right: 8px;
      background: none; border: none; cursor: pointer;
      padding: 6px; color: var(--color-text-secondary);
      border-radius: 6px; font-size: 1.1rem;
      display: flex; align-items: center;
    }
    .toggle-pw-btn:focus-visible { outline: 2px solid var(--color-primary); }
    .strength-bar {
      height: 4px;
      background: var(--color-border);
      border-radius: 2px;
      margin: 8px 0 6px;
      overflow: hidden;
    }
    .strength-level {
      height: 100%; border-radius: 2px;
      transition: width 0.3s ease, background 0.3s ease;
    }
    .strength-0 { width: 0%; }
    .strength-1 { width: 33%; background: #ef4444; }
    .strength-2 { width: 66%; background: #f59e0b; }
    .strength-3 { width: 100%; background: #10b981; }
    .strength-checks { display: flex; flex-direction: column; gap: 4px; }
    .check {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.78rem;
    }
    .check.ok { color: #10b981; }
    .check.fail { color: var(--color-text-secondary); }
    .field-error { color: var(--ion-color-danger); font-size: 0.78rem; margin: 4px 0 0; display: block; }
    .field-pending { color: var(--color-text-secondary); font-size: 0.78rem; font-style: italic; display: block; margin: 4px 0 0; }
    .submit-btn { --border-radius: 12px; margin-top: 8px; font-weight: 700; height: 50px; }
    .login-link {
      text-align: center; font-size: 0.85rem;
      color: var(--color-text-secondary); margin: 16px 0 0;
    }
    .login-link a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }
    .login-link a:focus-visible { outline: 2px solid var(--color-primary); border-radius: 3px; }
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
        this.notif.success(`¡Cuenta creada! Bienvenido, ${res.user.name}`);
        this.router.navigate(['/tickets']);
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
