/**
 * @file help.page.ts
 * @description Manual de usuario embebido con arquitectura del sistema,
 * guía de accesibilidad y documentación de la aplicación EnterpriseHub PWA.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonMenuButton, IonIcon, IonAccordion, IonAccordionGroup, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline, informationCircleOutline, accessibilityOutline,
  codeSlashOutline, serverOutline, shieldCheckmarkOutline,
  helpCircleOutline, keyOutline, peopleOutline, ticketOutline,
  statsChartOutline, gitBranchOutline, documentTextOutline,
  menuOutline, chevronDownOutline, constructOutline
} from 'ionicons/icons';

addIcons({
  bookOutline, informationCircleOutline, accessibilityOutline,
  codeSlashOutline, serverOutline, shieldCheckmarkOutline,
  helpCircleOutline, keyOutline, peopleOutline, ticketOutline,
  statsChartOutline, gitBranchOutline, documentTextOutline,
  menuOutline, chevronDownOutline, constructOutline
});

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonIcon,
    IonAccordion, IonAccordionGroup, IonItem, IonLabel,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <ion-icon name="book-outline" aria-hidden="true"></ion-icon>
            Ayuda & Documentación
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <main class="help-main" id="main-content" role="main">

        <!-- Hero de ayuda -->
        <section class="help-hero" aria-label="Bienvenida a la ayuda">
          <div class="help-hero__icon" aria-hidden="true">
            <ion-icon name="help-circle-outline"></ion-icon>
          </div>
          <h1 class="help-hero__title">Centro de Ayuda</h1>
          <p class="help-hero__desc">
            EnterpriseHub PWA — Sistema de Gestión Multiplataforma B2B<br>
            2º DAM Desarrollo de Interfaces | Instituto Nebrija de Formación Profesional
          </p>
          <div class="tech-stack" role="list" aria-label="Tecnologías utilizadas">
            <span role="listitem" class="tech-badge">Ionic 9</span>
            <span role="listitem" class="tech-badge">Angular 22</span>
            <span role="listitem" class="tech-badge">TypeScript 6</span>
            <span role="listitem" class="tech-badge">RxJS 7</span>
            <span role="listitem" class="tech-badge">Chart.js</span>
            <span role="listitem" class="tech-badge">jsPDF</span>
            <span role="listitem" class="tech-badge">WCAG 2.1 AA</span>
          </div>
        </section>

        <!-- Acordeón con secciones de ayuda -->
        <ion-accordion-group [multiple]="true" class="help-accordion">

          <!-- Credenciales de acceso -->
          <ion-accordion value="credentials" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="key-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Credenciales de Acceso</h2>
                <p>Cuentas predefinidas para demostración</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <div class="credentials-grid">
                <div class="cred-card cred-admin">
                  <div class="cred-card__header">
                    <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
                    <strong>Administrador</strong>
                    <span class="role-badge role-admin">ADMIN</span>
                  </div>
                  <table class="cred-table" aria-label="Credenciales de administrador">
                    <tbody>
                      <tr><td>Email:</td><td><code>admin&#64;enterprise.io</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>Admin123!</code></td></tr>
                      <tr><td>Acceso:</td><td>Dashboard, Tickets, Ayuda</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="cred-card cred-user">
                  <div class="cred-card__header">
                    <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                    <strong>Usuario Operaciones</strong>
                    <span class="role-badge role-user">USER</span>
                  </div>
                  <table class="cred-table" aria-label="Credenciales de usuario">
                    <tbody>
                      <tr><td>Email:</td><td><code>user&#64;enterprise.io</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>User123!</code></td></tr>
                      <tr><td>Acceso:</td><td>Tickets, Ayuda</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Arquitectura del sistema -->
          <ion-accordion value="architecture" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="code-slash-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Arquitectura del Sistema</h2>
                <p>Estructura técnica del proyecto</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <section aria-label="Estructura de archivos del proyecto">
                <h3 class="arch-subtitle">Estructura de Directorios</h3>
                <pre class="code-block" tabindex="0" aria-label="Árbol de directorios del proyecto"><code>src/app/
├── core/
│   ├── models/           # Interfaces TypeScript
│   │   ├── auth.model.ts
│   │   ├── ticket.model.ts
│   │   └── metric.model.ts
│   ├── services/         # Lógica de negocio
│   │   ├── auth.service.ts       # BehaviorSubject
│   │   ├── sql-mock.service.ts   # API REST simulada
│   │   ├── nosql-mock.service.ts # Tiempo real
│   │   ├── export.service.ts     # CSV + PDF
│   │   └── notification.service.ts
│   └── guards/
│       ├── auth.guard.ts         # Rutas privadas
│       └── role.guard.ts         # Solo ADMIN
├── shared/
│   └── components/
│       ├── data-table/   # Tabla reutilizable
│       └── metric-card/  # KPI widget
├── pages/
│   ├── login/            # Formulario reactivo
│   ├── register/         # Validador asíncrono
│   ├── dashboard/        # forkJoin + Chart.js
│   ├── tickets/          # DataTable + Modal
│   └── help/             # Manual embebido
├── app.component.ts      # Layout global
├── app.routes.ts         # Lazy Loading + Guards
└── app.config.ts         # Providers standalone</code></pre>
              </section>

              <section aria-label="Patrones reactivos utilizados" class="arch-section">
                <h3 class="arch-subtitle">Patrones RxJS Implementados</h3>
                <ul class="arch-list" role="list">
                  <li role="listitem"><strong>BehaviorSubject</strong> — Estado global de autenticación en AuthService</li>
                  <li role="listitem"><strong>forkJoin</strong> — Carga paralela de datos SQL + NoSQL en Dashboard</li>
                  <li role="listitem"><strong>debounceTime(300)</strong> — Búsqueda reactiva en DataTable y validador email</li>
                  <li role="listitem"><strong>distinctUntilChanged</strong> — Evita peticiones duplicadas en búsqueda</li>
                  <li role="listitem"><strong>switchMap</strong> — Cancelación automática en validador asíncrono</li>
                  <li role="listitem"><strong>takeUntil</strong> — Gestión de suscripciones sin memory leaks</li>
                  <li role="listitem"><strong>interval + shareReplay</strong> — Actualización en vivo de métricas NoSQL</li>
                </ul>
              </section>
            </div>
          </ion-accordion>

          <!-- Funcionalidades principales -->
          <ion-accordion value="features" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="construct-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Funcionalidades del Sistema</h2>
                <p>Guía de uso de cada módulo</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <div class="feature-grid">
                <div class="feature-card" role="region" aria-labelledby="feat-dashboard">
                  <h3 id="feat-dashboard" class="feature-title">
                    <ion-icon name="stats-chart-outline" aria-hidden="true"></ion-icon>
                    Dashboard (Solo ADMIN)
                  </h3>
                  <ul role="list">
                    <li>4 KPIs en tiempo real con tendencias</li>
                    <li>Gráfico de barras: CPU y RAM por servidor</li>
                    <li>Gráfico Doughnut: distribución de tickets</li>
                    <li>Exportar reporte PDF profesional con jsPDF</li>
                    <li>Exportar datos a CSV con descarga automática</li>
                    <li>Pull-to-refresh para actualización manual</li>
                  </ul>
                </div>
                <div class="feature-card" role="region" aria-labelledby="feat-tickets">
                  <h3 id="feat-tickets" class="feature-title">
                    <ion-icon name="ticket-outline" aria-hidden="true"></ion-icon>
                    Tickets (ADMIN y USER)
                  </h3>
                  <ul role="list">
                    <li>Vista de todos los tickets con DataTable</li>
                    <li>Búsqueda reactiva con debounceTime</li>
                    <li>Paginación numérica accesible</li>
                    <li>Crear nuevo ticket con formulario modal</li>
                    <li>Estados visuales con badges de colores</li>
                    <li>Estadísticas de tickets por estado</li>
                  </ul>
                </div>
                <div class="feature-card" role="region" aria-labelledby="feat-auth">
                  <h3 id="feat-auth" class="feature-title">
                    <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
                    Autenticación
                  </h3>
                  <ul role="list">
                    <li>Login con formulario reactivo Angular</li>
                    <li>Validación de credenciales mock (400ms delay)</li>
                    <li>Persistencia de sesión en localStorage</li>
                    <li>Registro con validador asíncrono de email</li>
                    <li>Guards de autenticación y de rol</li>
                    <li>Botones de acceso rápido para demos</li>
                  </ul>
                </div>
              </div>
            </div>
          </ion-accordion>

          <!-- Accesibilidad WCAG -->
          <ion-accordion value="a11y" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="accessibility-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Accesibilidad WCAG 2.1 AA/AAA</h2>
                <p>Guía de características de accesibilidad implementadas</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <section aria-label="Características de accesibilidad">
                <h3 class="arch-subtitle">Características Implementadas</h3>
                <div class="a11y-grid">
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">⌨️</span>
                    <div>
                      <strong>Navegación por Teclado</strong>
                      <p>Tab, Enter, Espacio funcionan en todos los elementos interactivos. Outline visible en :focus-visible.</p>
                    </div>
                  </div>
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">🔊</span>
                    <div>
                      <strong>Lectores de Pantalla</strong>
                      <p>aria-label, aria-live, aria-describedby, role="alert" en todos los formularios y toasts.</p>
                    </div>
                  </div>
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">🎨</span>
                    <div>
                      <strong>Contraste de Color</strong>
                      <p>Ratio mínimo 4.5:1 para texto normal. Modo claro y oscuro compatibles.</p>
                    </div>
                  </div>
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">📋</span>
                    <div>
                      <strong>HTML Semántico</strong>
                      <p>main, nav, header, section, article, table con caption. Jerarquía h1-h3 correcta por página.</p>
                    </div>
                  </div>
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">🌐</span>
                    <div>
                      <strong>ARIA Roles</strong>
                      <p>role="grid", role="gridcell", role="columnheader", role="navigation", role="search" en DataTable.</p>
                    </div>
                  </div>
                  <div class="a11y-item" role="listitem">
                    <span class="a11y-icon" aria-hidden="true">📱</span>
                    <div>
                      <strong>Responsive</strong>
                      <p>Diseño adaptativo para móvil, tablet y escritorio. Tabla en modo card-style en pantallas pequeñas.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </ion-accordion>

          <!-- Despliegue -->
          <ion-accordion value="deploy" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="git-branch-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Despliegue y Comandos</h2>
                <p>Guía de instalación y despliegue en Vercel</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <h3 class="arch-subtitle">Comandos de Desarrollo</h3>
              <pre class="code-block" tabindex="0"><code># Instalar dependencias
npm install

# Servidor de desarrollo
npm start          # http://localhost:4200

# Compilar producción
npm run build

# Generar documentación Compodoc
npm run compodoc   # Abre en http://localhost:8080</code></pre>

              <h3 class="arch-subtitle" style="margin-top:16px;">Despliegue en Vercel</h3>
              <pre class="code-block" tabindex="0"><code># 1. Instalar Vercel CLI
npm i -g vercel

# 2. Build de producción
npm run build

# 3. Desplegar (primera vez)
vercel --prod

# El vercel.json ya está configurado para SPA routing</code></pre>

              <h3 class="arch-subtitle" style="margin-top:16px;">Git Flow Recomendado</h3>
              <pre class="code-block" tabindex="0"><code>main              # Producción (Vercel)
└── develop       # Integración
    ├── feature/login
    ├── feature/dashboard
    ├── feature/tickets
    └── hotfix/   # Correcciones urgentes</code></pre>
            </div>
          </ion-accordion>

        </ion-accordion-group>

        <!-- Footer -->
        <footer class="help-footer" role="contentinfo">
          <p>
            <strong>EnterpriseHub PWA</strong> — Trabajo de Evaluación Final<br>
            Módulo: Desarrollo de Interfaces (Código: 0488) | 2º Grado Superior DAM<br>
            Instituto Nebrija de Formación Profesional | Curso 2025-2026
          </p>
        </footer>

      </main>
    </ion-content>
  `,
  styles: [`
    .help-main { padding: 16px; }
    .toolbar-title { display: flex; align-items: center; gap: 8px; font-weight: 700; }

    /* Hero */
    .help-hero {
      text-align: center;
      padding: 32px 16px 24px;
    }
    .help-hero__icon {
      width: 72px; height: 72px;
      border-radius: 24px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      font-size: 2rem; color: white;
    }
    .help-hero__title {
      font-size: 1.6rem; font-weight: 800;
      color: var(--color-text-primary); margin: 0 0 6px;
    }
    .help-hero__desc {
      font-size: 0.85rem; color: var(--color-text-secondary);
      line-height: 1.6; margin: 0 0 16px;
    }
    .tech-stack { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .tech-badge {
      background: var(--color-primary);
      color: white;
      font-size: 0.72rem; font-weight: 700;
      padding: 4px 10px; border-radius: 20px;
      letter-spacing: 0.03em;
    }

    /* Accordion */
    .help-accordion { margin-bottom: 16px; }
    .accordion-header {
      --background: var(--surface-card);
      --border-color: var(--color-border);
    }
    .accordion-content { padding: 16px; background: var(--surface-ground); }

    /* Credentials */
    .credentials-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .credentials-grid { grid-template-columns: 1fr; } }
    .cred-card {
      border-radius: 12px; padding: 14px;
      border: 1px solid var(--color-border);
    }
    .cred-admin { background: rgba(25,42,86,0.05); border-left: 3px solid var(--color-primary); }
    .cred-user  { background: rgba(6,182,212,0.05); border-left: 3px solid #0891b2; }
    .cred-card__header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9rem; margin-bottom: 10px;
    }
    .role-badge {
      font-size: 0.65rem; font-weight: 700; padding: 2px 7px;
      border-radius: 10px; letter-spacing: 0.05em;
    }
    .role-admin { background: var(--color-primary); color: white; }
    .role-user  { background: #0891b2; color: white; }
    .cred-table { width: 100%; font-size: 0.82rem; border-collapse: collapse; }
    .cred-table td { padding: 4px 0; color: var(--color-text-secondary); }
    .cred-table td:first-child { font-weight: 600; width: 100px; }
    .cred-table code {
      font-family: monospace; font-size: 0.85rem;
      background: var(--surface-card); padding: 1px 6px;
      border-radius: 4px; color: var(--color-text-primary);
    }

    /* Architecture */
    .code-block {
      background: #1e2a3a;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      font-size: 0.78rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      font-family: 'Courier New', monospace;
      margin: 0;
    }
    .code-block:focus-visible { outline: 2px solid var(--color-primary); }
    .arch-subtitle {
      font-size: 0.95rem; font-weight: 700;
      color: var(--color-text-primary); margin: 0 0 10px;
    }
    .arch-section { margin-top: 20px; }
    .arch-list {
      font-size: 0.85rem; color: var(--color-text-secondary);
      line-height: 1.8; padding-left: 20px;
    }
    .arch-list li { margin-bottom: 4px; }
    .arch-list strong { color: var(--color-text-primary); }

    /* Features */
    .feature-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .feature-card {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 12px; padding: 14px;
    }
    .feature-title {
      font-size: 0.9rem; font-weight: 700;
      color: var(--color-primary);
      display: flex; align-items: center; gap: 6px;
      margin: 0 0 10px;
    }
    .feature-card ul {
      font-size: 0.8rem; color: var(--color-text-secondary);
      padding-left: 16px; line-height: 1.8; margin: 0;
    }

    /* A11y */
    .a11y-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .a11y-grid { grid-template-columns: 1fr; } }
    .a11y-item {
      display: flex; gap: 10px; align-items: flex-start;
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px; padding: 12px;
    }
    .a11y-icon { font-size: 1.5rem; flex-shrink: 0; }
    .a11y-item strong { font-size: 0.85rem; display: block; color: var(--color-text-primary); margin-bottom: 3px; }
    .a11y-item p { font-size: 0.78rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }

    /* Footer */
    .help-footer {
      text-align: center;
      padding: 24px 16px;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      line-height: 1.7;
      border-top: 1px solid var(--color-border);
      margin-top: 16px;
    }
  `]
})
export class HelpPage {}
