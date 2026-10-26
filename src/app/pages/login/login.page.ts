/**
 * @file login.page.ts
 * @description Pasarela de Autenticación Split-Screen (Módulo 0488 - Desarrollo de Interfaces).
 * Diseño asimétrico de doble panel que combina documentación interactiva del flujo RBAC/Signals
 * con acceso rápido de laboratorio ('admin / 123' y 'operador / 123') y prueba en vivo de authGuard.
 */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import {
  IonContent, IonInput, IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, shieldCheckmarkOutline, serverOutline, alertCircleOutline,
  keyOutline, terminalOutline, sunnyOutline, moonOutline,
  globeOutline, logoGithub, flashOutline, codeSlashOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

addIcons({
  personOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  logInOutline, shieldCheckmarkOutline, serverOutline, alertCircleOutline,
  keyOutline, terminalOutline, sunnyOutline, moonOutline,
  globeOutline, logoGithub, flashOutline, codeSlashOutline
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonIcon, IonText
  ],
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <div class="login-shell">

        <!-- Barra superior flotante con Enlaces Oficiales y Conmutador de Tema -->
        <header class="login-topbar">
          <div class="topbar-brand">
            <div class="topbar-icon">
              <ion-icon name="terminal-outline"></ion-icon>
            </div>
            <span class="topbar-name">EnterpriseHub <strong>NOC v2.0</strong></span>
            <span class="topbar-tag">MÓDULO 0488 · DAM2</span>
          </div>

          <div class="topbar-actions">
            <a
              href="https://enterprise-hub-di-mauve.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              class="topbar-link"
              title="Abrir aplicación desplegada en Vercel"
            >
              <ion-icon name="globe-outline"></ion-icon>
              <span>Vercel Live</span>
            </a>
            <a
              href="https://github.com/Thepimen/enterprise-hub-pwa"
              target="_blank"
              rel="noopener noreferrer"
              class="topbar-link"
              title="Abrir repositorio en GitHub"
            >
              <ion-icon name="logo-github"></ion-icon>
              <span>GitHub Repo</span>
            </a>
            <button
              type="button"
              class="theme-switch-pill"
              (click)="authService.toggleTheme()"
              aria-label="Alternar tema claro u oscuro"
            >
              <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'"></ion-icon>
              <span>{{ authService.theme() === 'dark' ? 'Modo Claro' : 'Modo Oscuro' }}</span>
            </button>
          </div>
        </header>

        <!-- Layout Asimétrico Split-Screen -->
        <main class="login-split-grid" id="main-content" role="main">

          <!-- Columna Izquierda: Arquitectura Interactiva de Seguridad RBAC & Signals -->
          <section class="security-showcase" aria-label="Arquitectura de Control de Acceso">
            <div class="showcase-eyebrow">
              <span class="pulse-led"></span>
              <span>ARQUITECTURA DE SEGURIDAD REACTIVA EN VIVO</span>
            </div>

            <h1 class="showcase-title">
              Control de Acceso Granular con <span class="accent-cyan">Angular Signals</span> &amp; <span class="accent-blue">Functional Guards</span>
            </h1>

            <p class="showcase-lead">
              Sistema multiplataforma B2B diseñado con persistencia determinista en <code>sessionStorage</code>
              (clave <code>DAM2_AUTH_SESSION</code>) y redirección atómica mediante objetos <code>UrlTree</code>.
            </p>

            <!-- Pipeline de Seguridad de 3 Etapas -->
            <div class="pipeline-steps">
              <div class="pipe-step">
                <div class="pipe-num">01</div>
                <div class="pipe-body">
                  <h3>Estado Reactivo con Signals (AuthService)</h3>
                  <p><code>_currentUser = signal&lt;UserSession | null&gt;()</code> expone <code>currentUser</code> de solo lectura y el selector computado <code>isAuthenticated = computed(...)</code>.</p>
                </div>
              </div>

              <div class="pipe-step">
                <div class="pipe-num">02</div>
                <div class="pipe-body">
                  <h3>Web Storage API (sessionStorage)</h3>
                  <p>Sincronización automática bajo la clave <code>DAM2_AUTH_SESSION</code> con lectura protegida por bloque <code>try/catch</code> contra corrupción de JSON.</p>
                </div>
              </div>

              <div class="pipe-step">
                <div class="pipe-num">03</div>
                <div class="pipe-body">
                  <h3>Guardas Funcionales (authGuard + roleGuard)</h3>
                  <p>Factoría <code>roleGuard('admin' | 'user')</code> que aisla <code>/admin</code> y <code>/user-dashboard</code> devolviendo un <code>UrlTree</code> atómico.</p>
                </div>
              </div>
            </div>

            <!-- Simulador de Intrusión en Ruta Protegida sin Sesión -->
            <div class="guard-probe-box">
              <div class="probe-header">
                <span class="probe-title">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                  Prueba de Intercepción Perimetral (authGuard)
                </span>
                <span class="probe-return-badge" *ngIf="currentReturnUrl">
                  returnUrl detectado: {{ currentReturnUrl }}
                </span>
              </div>
              <p class="probe-desc">
                Pulsa para intentar navegar a <code>/admin</code> sin iniciar sesión y verificar cómo <code>authGuard</code> bloquea el acceso y adjunta <code>?returnUrl=%2Fadmin</code>:
              </p>
              <button
                type="button"
                id="btn-probe-unauth"
                class="probe-btn"
                (click)="simulateUnauthorizedAccess()"
              >
                <ion-icon name="lock-closed-outline"></ion-icon>
                <span>Probar acceso sin sesión a /admin (Test authGuard)</span>
              </button>
            </div>
          </section>

          <!-- Columna Derecha: Consola de Autenticación y Lanzadores de Rol -->
          <section class="auth-deck" aria-label="Formulario de inicio de sesión">
            <div class="auth-card">
              <div class="auth-card-header">
                <div>
                  <span class="deck-kicker">TERMINAL DE AUTENTICACIÓN</span>
                  <h2 class="deck-title">Iniciar Sesión Operativa</h2>
                </div>
                <div class="deck-icon-box">
                  <ion-icon name="key-outline"></ion-icon>
                </div>
              </div>

              <!-- Alerta si viene redirigido por authGuard con returnUrl -->
              <div class="return-url-alert" *ngIf="currentReturnUrl" role="status">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <div>
                  <strong>Intercepción de authGuard activa:</strong>
                  <span>Acceso redirigido desde <code>{{ currentReturnUrl }}</code>. Inicia sesión para continuar.</span>
                </div>
              </div>

              <form
                [formGroup]="loginForm"
                (ngSubmit)="onSubmit()"
                novalidate
                aria-label="Formulario de inicio de sesión"
                class="auth-form"
              >
                <!-- Campo Usuario -->
                <div class="field-group">
                  <label for="login-username" class="field-label">
                    Identificador de Usuario
                  </label>
                  <ion-input
                    id="login-username"
                    type="text"
                    formControlName="username"
                    placeholder="Ej: admin o operador"
                    autocomplete="username"
                    [class.input-error]="isFieldInvalid('username')"
                    aria-required="true"
                    class="enterprise-input"
                  ></ion-input>
                  <ion-text color="danger" *ngIf="isFieldInvalid('username')">
                    <p class="field-error" role="alert">El identificador de usuario es obligatorio.</p>
                  </ion-text>
                </div>

                <!-- Campo Contraseña -->
                <div class="field-group">
                  <label for="login-password" class="field-label">Clave de Acceso</label>
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

                <!-- Mensaje de error con ion-text color="danger" (Requisito 3.2) -->
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

                <!-- Botón Principal de Envío -->
                <button
                  type="submit"
                  class="primary-submit-btn"
                  aria-label="Autenticar y acceder al sistema"
                >
                  <ion-icon name="log-in-outline" aria-hidden="true"></ion-icon>
                  <span>Autenticar Credenciales</span>
                </button>
              </form>

              <!-- Lanzadores Rápidos de Evaluación (Requisito 3.2) -->
              <div class="quick-launch-section">
                <div class="quick-launch-header">
                  <ion-icon name="flash-outline"></ion-icon>
                  <span>ACCESO RÁPIDO 1-CLIC (PRÁCTICA LABORATORIO)</span>
                </div>

                <div class="quick-launch-grid">
                  <button
                    id="btn-quick-admin"
                    type="button"
                    class="role-launcher role-launcher--admin"
                    (click)="quickLogin('admin', '123')"
                  >
                    <div class="launcher-top">
                      <span class="launcher-pill launcher-pill--admin">ROL: ADMIN</span>
                      <span class="launcher-route">/admin</span>
                    </div>
                    <strong class="launcher-title">Admin (admin / 123)</strong>
                    <span class="launcher-desc">Consola NOC, telemetría y control total</span>
                  </button>

                  <button
                    id="btn-quick-operador"
                    type="button"
                    class="role-launcher role-launcher--user"
                    (click)="quickLogin('operador', '123')"
                  >
                    <div class="launcher-top">
                      <span class="launcher-pill launcher-pill--user">ROL: USER</span>
                      <span class="launcher-route">/user-dashboard</span>
                    </div>
                    <strong class="launcher-title">Operador (operador / 123)</strong>
                    <span class="launcher-desc">Workstation L1 y prueba de bloqueo RBAC</span>
                  </button>
                </div>
              </div>

              <!-- Pie de tarjeta: Registro -->
              <div class="register-footer-link">
                <span>¿Deseas dar de alta un nuevo operador?</span>
                <a routerLink="/register">Crear cuenta con validador asíncrono</a>
              </div>
            </div>
          </section>

        </main>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: var(--surface-ground);
    }
    .login-shell {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.12), transparent 38%),
        radial-gradient(circle at 88% 82%, rgba(6, 182, 212, 0.10), transparent 38%),
        var(--surface-ground);
    }

    /* Topbar */
    .login-topbar {
      max-width: 1320px;
      width: 100%;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .topbar-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .topbar-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .topbar-tag {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .topbar-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 11px;
      border-radius: 8px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.76rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s;
    }
    .topbar-link:hover {
      color: var(--color-text-primary);
      border-color: var(--color-primary-light);
    }
    .theme-switch-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* Split Grid */
    .login-split-grid {
      max-width: 1320px;
      width: 100%;
      margin: auto;
      padding: 28px 24px 44px;
      display: grid;
      grid-template-columns: 1.12fr 0.88fr;
      gap: 36px;
      align-items: center;
    }
    @media (max-width: 960px) {
      .login-split-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }

    /* Left Showcase */
    .security-showcase {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .showcase-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-accent);
      letter-spacing: 0.06em;
    }
    .pulse-led {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .showcase-title {
      font-size: clamp(1.65rem, 2.6vw, 2.35rem);
      font-weight: 800;
      color: var(--color-text-primary);
      line-height: 1.18;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .accent-cyan { color: #06b6d4; }
    .accent-blue { color: #3b82f6; }
    .showcase-lead {
      font-size: 0.92rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
    }
    .showcase-lead code {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-primary);
    }

    .pipeline-steps {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .pipe-step {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 13px 16px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
    }
    .pipe-num {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
      flex-shrink: 0;
    }
    .pipe-body h3 {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 3px;
    }
    .pipe-body p {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      line-height: 1.45;
      margin: 0;
    }
    .pipe-body code {
      font-family: var(--font-mono);
      font-size: 0.73rem;
      color: var(--color-primary-light);
    }

    .guard-probe-box {
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--surface-elevated);
      border: 1px dashed var(--badge-admin-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .probe-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .probe-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .probe-title ion-icon {
      color: #06b6d4;
      font-size: 1.05rem;
    }
    .probe-return-badge {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
    }
    .probe-desc {
      font-size: 0.76rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .probe-btn {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .probe-btn:hover {
      border-color: #06b6d4;
      color: #22d3ee;
    }

    /* Right Auth Deck */
    .auth-card {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 26px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .auth-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 14px;
    }
    .deck-kicker {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--color-accent);
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 3px;
    }
    .deck-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }
    .deck-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .return-url-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: var(--color-text-primary);
      font-size: 0.78rem;
    }
    .return-url-alert ion-icon {
      font-size: 1.3rem;
      color: #f59e0b;
      flex-shrink: 0;
    }
    .return-url-alert div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .enterprise-input {
      --background: var(--surface-ground);
      --color: var(--color-text-primary);
      --placeholder-color: var(--color-text-disabled);
      --padding-start: 14px;
      --padding-end: 14px;
      --padding-top: 10px;
      --padding-bottom: 10px;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      font-size: 0.875rem;
      min-height: 44px;
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
      right: 10px;
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
      font-weight: 600;
      margin: 2px 0 0;
    }

    .login-error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.45);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .login-error-banner ion-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .error-msg-text {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .primary-submit-btn {
      width: 100%;
      height: 46px;
      background: var(--btn-primary-bg);
      color: #ffffff;
      border: 1px solid var(--btn-primary-border);
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 700;
      font-family: var(--font-sans);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .primary-submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
    }

    /* Quick Launch Grid */
    .quick-launch-section {
      border-top: 1px solid var(--color-border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .quick-launch-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--color-text-secondary);
      letter-spacing: 0.05em;
    }
    .quick-launch-header ion-icon {
      color: #f59e0b;
      font-size: 0.95rem;
    }
    .quick-launch-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 480px) {
      .quick-launch-grid {
        grid-template-columns: 1fr;
      }
    }
    .role-launcher {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 12px;
      border-radius: 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }
    .role-launcher--admin:hover {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .role-launcher--user:hover {
      border-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .launcher-top {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .launcher-pill {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .launcher-pill--admin {
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .launcher-pill--user {
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .launcher-route {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--color-text-secondary);
    }
    .launcher-title {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .launcher-desc {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      line-height: 1.3;
    }

    .register-footer-link {
      text-align: center;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .register-footer-link a {
      color: var(--color-primary-light);
      font-weight: 700;
      text-decoration: none;
    }
    .register-footer-link a:hover {
      text-decoration: underline;
    }
  `],
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  loginForm!: FormGroup;
  showPassword = false;
  loginError: string | null = null;

  get currentReturnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

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
   * Simula un intento de navegación sin sesión a /admin para demostrar que authGuard
   * redirige atómicamente a /login?returnUrl=%2Fadmin
   */
  async simulateUnauthorizedAccess(): Promise<void> {
    await this.router.navigate(['/admin']);
    this.loginError = 'authGuard interceptó el acceso sin sesión a /admin y redirigió con returnUrl.';
    this.notify.warning('authGuard: Acceso denegado sin sesión -> /login?returnUrl=%2Fadmin');
  }

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

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const target = session?.role === 'admin' ? '/admin' : '/user-dashboard';
    this.router.navigate([target]);
  }
}
