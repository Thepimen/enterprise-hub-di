/**
 * @file welcome.page.ts
 * @description Página de aterrizaje y bienvenida corporativa (WelcomePage).
 * Punto de entrada humanizado (No-AI Look) que reemplaza la redirección abrupta al login.
 * Implementa las 5 facetas de User-Friendly Design:
 * - Faceta 1: Onboarding contextual no intrusivo con 3 propuestas de valor.
 * - Fondo arquitectónico corporativo real con overlay oscuro para contraste WCAG 2.1 AAA (> 7:1).
 * - Faceta 5: Accesibilidad completa por teclado, indicadores :focus-visible y soporte prefers-reduced-motion.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logInOutline, personAddOutline, shieldCheckmarkOutline,
  pulseOutline, ticketOutline, lockClosedOutline, serverOutline,
  globeOutline, logoGithub, chevronForwardOutline, sunnyOutline,
  moonOutline, checkmarkCircleOutline, arrowForwardOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

addIcons({
  logInOutline, personAddOutline, shieldCheckmarkOutline,
  pulseOutline, ticketOutline, lockClosedOutline, serverOutline,
  globeOutline, logoGithub, chevronForwardOutline, sunnyOutline,
  moonOutline, checkmarkCircleOutline, arrowForwardOutline
});

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonIcon
  ],
  template: `
    <ion-header [translucent]="false" class="welcome-header">
      <ion-toolbar class="welcome-toolbar">
        <ion-title>
          <div class="brand-group">
            <span class="brand-badge-dot" aria-hidden="true"></span>
            <span class="brand-title">EnterpriseHub <span class="brand-sub">PWA</span></span>
            <span class="brand-pill hide-xs">MÓDULO 0488</span>
          </div>
        </ion-title>

        <ion-buttons slot="end">
          <a
            href="https://enterprise-hub-di-mauve.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            class="topbar-ext-btn hide-sm"
            aria-label="Abrir aplicación desplegada en Vercel"
          >
            <ion-icon name="globe-outline" aria-hidden="true"></ion-icon>
            <span>Vercel Live</span>
          </a>

          <a
            href="https://github.com/Thepimen/enterprise-hub-pwa"
            target="_blank"
            rel="noopener noreferrer"
            class="topbar-ext-btn hide-sm"
            aria-label="Abrir repositorio de código en GitHub"
          >
            <ion-icon name="logo-github" aria-hidden="true"></ion-icon>
            <span>GitHub</span>
          </a>

          <button
            type="button"
            class="theme-toggle-btn"
            (click)="authService.toggleTheme()"
            [attr.aria-label]="authService.theme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            title="Alternar tema visual"
          >
            <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'" aria-hidden="true"></ion-icon>
          </button>

          <a
            routerLink="/login"
            class="login-cta-btn"
            aria-label="Ir al formulario de inicio de sesión"
          >
            <ion-icon name="log-in-outline" aria-hidden="true"></ion-icon>
            <span>Iniciar Sesión</span>
          </a>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" class="welcome-content">
      <!-- HERO PRINCIPAL CON FOTOGRAFÍA ARQUITECTÓNICA REAL Y OVERLAY DE ALTO CONTRASTE -->
      <section class="hero-banner" role="banner" aria-label="Introducción a EnterpriseHub">
        <div class="hero-overlay"></div>
        <div class="hero-container">
          <div class="hero-badge">
            <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
            <span>ARQUITECTURA DE SEGURIDAD DEFENSIVA &amp; CONTROL DE ACCESO RBAC</span>
          </div>

          <h1 class="hero-heading">
            Gestión de Infraestructura B2B &amp; Plataforma Operativa SRE
          </h1>

          <p class="hero-description">
            Consola empresarial para monitorización de clústeres en tiempo real, trazabilidad de incidencias
            técnicas y control de acceso granular con Angular Signals y Functional Guards.
          </p>

          <!-- LLAMADAS A LA ACCIÓN (CTAs) CLARAS Y ACCESIBLES -->
          <div class="hero-cta-group" role="group" aria-label="Acciones de acceso a la plataforma">
            <a
              routerLink="/login"
              class="cta-btn cta-btn--primary"
              id="welcome-cta-login"
              aria-label="Iniciar sesión en EnterpriseHub"
            >
              <ion-icon name="log-in-outline" aria-hidden="true"></ion-icon>
              <span>Iniciar Sesión</span>
              <ion-icon name="arrow-forward-outline" aria-hidden="true" class="cta-arrow"></ion-icon>
            </a>

            <a
              routerLink="/register"
              class="cta-btn cta-btn--secondary"
              id="welcome-cta-register"
              aria-label="Registrar nueva cuenta de operador"
            >
              <ion-icon name="person-add-outline" aria-hidden="true"></ion-icon>
              <span>Registrarse como Operador</span>
            </a>
          </div>

          <!-- Credenciales Rápidas de Laboratorio visibles de antemano -->
          <div class="lab-demo-credentials" role="note" aria-label="Credenciales oficiales para evaluación">
            <span class="cred-tag">Credenciales Demo:</span>
            <span class="cred-item"><strong>Admin:</strong> <code>admin</code> / <code>123</code></span>
            <span class="cred-sep">·</span>
            <span class="cred-item"><strong>Operador L1:</strong> <code>operador</code> / <code>123</code></span>
          </div>
        </div>
      </section>

      <!-- FACETA 1: ONBOARDING CONTEXTUAL NO INTRUSIVO (3 TARJETAS SOBRIAS DE VALOR) -->
      <section class="value-props-section" aria-label="Propuesta de valor y módulos de la plataforma">
        <div class="section-header">
          <span class="section-kicker">PROPUESTA DE VALOR</span>
          <h2 class="section-title">Diseñado para Operaciones Críticas sin Fricción</h2>
          <p class="section-subtitle">
            Arquitectura desacoplada, tipado inmutable y control estricto de privilegios desde la primera interacción.
          </p>
        </div>

        <div class="value-cards-grid">
          <!-- Tarjeta 1: Monitorización en Tiempo Real -->
          <article class="value-card">
            <div class="card-icon-box">
              <ion-icon name="pulse-outline" aria-hidden="true"></ion-icon>
            </div>
            <h3 class="card-title">Monitorización en Tiempo Real</h3>
            <p class="card-text">
              Telemetría continua de CPU, memoria y tráfico de red mediante flujos concurrentes con RxJS forkJoin.
              Visualización mediante curvas spline sobrias sin gráficos de barras genéricos.
            </p>
            <ul class="card-features">
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> Topología física de bastidor Blade</li>
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> Diagnóstico ICMP activo con medición de latencia</li>
            </ul>
          </article>

          <!-- Tarjeta 2: Gestión de Incidencias B2B -->
          <article class="value-card">
            <div class="card-icon-box">
              <ion-icon name="ticket-outline" aria-hidden="true"></ion-icon>
            </div>
            <h3 class="card-title">Gestión de Incidencias B2B</h3>
            <p class="card-text">
              Consola operativa para resolución de incidencias, trazabilidad de tickets con acuerdos de nivel
              de servicio (SLA) y filtrado instantáneo por severidad técnica.
            </p>
            <ul class="card-features">
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> Skeleton Loaders para transiciones fluidas</li>
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> DTOs inmutables con sanitización contra inyecciones</li>
            </ul>
          </article>

          <!-- Tarjeta 3: Auditoría y Control RBAC -->
          <article class="value-card">
            <div class="card-icon-box">
              <ion-icon name="lock-closed-outline" aria-hidden="true"></ion-icon>
            </div>
            <h3 class="card-title">Auditoría de Infraestructura &amp; RBAC</h3>
            <p class="card-text">
              Control de acceso granular gobernado por Angular Signals y Functional Guards (authGuard y roleGuard),
              con almacenamiento seguro de tokens en memoria y registro inmutable en tiempo real.
            </p>
            <ul class="card-features">
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> Redirección contextual inteligente (returnUrl)</li>
              <li><ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon> Cabeceras de seguridad CSP y directivas *hasRole</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- PIE DE PÁGINA CORPORATIVO -->
      <footer class="welcome-footer" role="contentinfo">
        <div class="footer-container">
          <div class="footer-info">
            <strong>EnterpriseHub PWA v1.4.0</strong> · Arquitectura de Interfaces &amp; Seguridad Frontend
            <p>Módulo 0488: Desarrollo de Interfaces · 2º DAM · Instituto Nebrija de Formación Profesional</p>
            <p class="footer-author">Autor: Luis Lázaro Pimentel · Fecha: 30 de Octubre de 2026</p>
          </div>
          <div class="footer-links">
            <a href="https://enterprise-hub-di-mauve.vercel.app" target="_blank" rel="noopener noreferrer">Producción Vercel</a>
            <a href="https://github.com/Thepimen/enterprise-hub-pwa" target="_blank" rel="noopener noreferrer">GitHub PWA</a>
            <a href="https://github.com/Thepimen/enterprise-hub-di" target="_blank" rel="noopener noreferrer">GitHub DI</a>
          </div>
        </div>
      </footer>
    </ion-content>
  `,
  styles: [`
    /* FONDOS Y PALETA GENERAL */
    .welcome-header {
      border-bottom: 1px solid var(--color-border-strong);
    }
    .welcome-toolbar {
      --background: var(--surface-card);
      --color: var(--color-text-primary);
      min-height: 64px;
      padding: 0 16px;
    }
    .brand-group {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .brand-badge-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--color-text-primary);
    }
    .brand-sub {
      color: var(--color-primary-light);
    }
    .brand-pill {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--surface-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .topbar-ext-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      margin-right: 8px;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .topbar-ext-btn:hover,
    .topbar-ext-btn:focus-visible {
      border-color: var(--color-primary-light);
      background: var(--color-hover);
    }

    .theme-toggle-btn {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      margin-right: 10px;
      transition: border-color 0.15s;
    }
    .theme-toggle-btn:hover,
    .theme-toggle-btn:focus-visible {
      border-color: var(--color-primary-light);
    }

    .login-cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 16px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border: 1px solid var(--btn-primary-border);
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .login-cta-btn:hover {
      opacity: 0.92;
    }

    /* HERO BANNER CON FOTOGRAFÍA ARQUITECTÓNICA REAL */
    .hero-banner {
      position: relative;
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 20px 60px;
      background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80');
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      overflow: hidden;
    }
    /* Overlay oscuro en CSS para asegurar contraste WCAG 2.1 AAA de 7:1 en textos */
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(6, 10, 18, 0.88) 0%,
        rgba(13, 20, 36, 0.94) 70%,
        var(--surface-ground) 100%
      );
      z-index: 1;
    }
    .hero-container {
      position: relative;
      z-index: 2;
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.22);
      color: #93c5fd;
      border: 1px solid rgba(96, 165, 250, 0.45);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .hero-heading {
      font-size: 2.45rem;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .hero-description {
      font-size: 1.05rem;
      color: #cbd5e1;
      line-height: 1.6;
      max-width: 720px;
      margin: 0;
    }

    .hero-cta-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      height: 48px;
      padding: 0 24px;
      border-radius: 10px;
      font-size: 0.92rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .cta-btn--primary {
      background: var(--btn-primary-bg);
      color: #ffffff;
      border: 1px solid var(--btn-primary-border);
      box-shadow: 0 4px 18px rgba(37, 99, 235, 0.4);
    }
    .cta-btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.55);
    }
    .cta-btn--secondary {
      background: var(--surface-elevated);
      color: #ffffff;
      border: 1px solid var(--color-border-strong);
    }
    .cta-btn--secondary:hover {
      transform: translateY(-2px);
      border-color: var(--color-primary-light);
    }
    .cta-arrow {
      font-size: 1.1rem;
      transition: transform 0.15s;
    }
    .cta-btn--primary:hover .cta-arrow {
      transform: translateX(4px);
    }

    .lab-demo-credentials {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 14px;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--color-border);
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .lab-demo-credentials strong {
      color: #ffffff;
    }
    .lab-demo-credentials code {
      font-family: var(--font-mono);
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .cred-sep {
      color: #475569;
    }

    /* FACETA 1: ONBOARDING CONTEXTUAL (3 TARJETAS SOBRIAS) */
    .value-props-section {
      max-width: 1240px;
      margin: 0 auto;
      padding: 64px 20px 80px;
    }
    .section-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .section-kicker {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-primary-light);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 6px 0 10px;
      letter-spacing: -0.02em;
    }
    .section-subtitle {
      font-size: 0.95rem;
      color: var(--color-text-secondary);
      max-width: 650px;
      margin: 0 auto;
    }

    .value-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .value-card {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.15s, transform 0.15s;
    }
    .value-card:hover {
      border-color: var(--color-primary-light);
      transform: translateY(-3px);
    }
    .card-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border-strong);
      color: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }
    .card-text {
      font-size: 0.88rem;
      color: var(--color-text-secondary);
      line-height: 1.55;
      margin: 0;
      flex: 1;
    }
    .card-features {
      list-style: none;
      padding: 0;
      margin: 8px 0 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.82rem;
      color: var(--color-text-primary);
      border-top: 1px solid var(--color-border);
      padding-top: 12px;
    }
    .card-features li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-features ion-icon {
      color: #10b981;
      font-size: 1.05rem;
      flex-shrink: 0;
    }

    /* FOOTER */
    .welcome-footer {
      border-top: 1px solid var(--color-border);
      background: var(--surface-card);
      padding: 32px 20px;
    }
    .footer-container {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .footer-info {
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
    .footer-info strong {
      color: var(--color-text-primary);
    }
    .footer-author {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-primary-light);
      margin-top: 2px;
    }
    .footer-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .footer-links a {
      color: var(--color-text-secondary);
      font-size: 0.82rem;
      text-decoration: none;
      transition: color 0.15s;
    }
    .footer-links a:hover,
    .footer-links a:focus-visible {
      color: var(--color-primary-light);
    }

    /* RESPONSIVE & ACCESIBILIDAD */
    @media (max-width: 768px) {
      .hero-heading { font-size: 1.85rem; }
      .hero-description { font-size: 0.95rem; }
      .hide-sm { display: none !important; }
    }
    @media (max-width: 480px) {
      .hide-xs { display: none !important; }
    }

    /* FACETA 5: INDICADORES :focus-visible DE ALTO CONTRASTE */
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--color-primary-light) !important;
      outline-offset: 3px !important;
    }

    /* REDUCCIÓN DE MOVIMIENTO */
    @media (prefers-reduced-motion: reduce) {
      .cta-btn,
      .value-card,
      .cta-arrow {
        transition: none !important;
        transform: none !important;
      }
    }
  `],
})
export class WelcomePage {
  readonly authService = inject(AuthService);
}
