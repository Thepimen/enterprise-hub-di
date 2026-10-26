/**
 * @file help.page.ts
 * @description Manual de usuario embebido con arquitectura del sistema,
 * guía de accesibilidad y documentación de la aplicación EnterpriseHub PWA.
 * Refactorizado según las directrices de Taste Skill:
 * - Sin degradados ni elementos con sombras pesadas
 * - Encabezado editorial sobrio, insignias planas y bloques de código legibles
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
  menuOutline, chevronDownOutline, constructOutline, hardwareChipOutline,
  terminalOutline
} from 'ionicons/icons';

addIcons({
  bookOutline, informationCircleOutline, accessibilityOutline,
  codeSlashOutline, serverOutline, shieldCheckmarkOutline,
  helpCircleOutline, keyOutline, peopleOutline, ticketOutline,
  statsChartOutline, gitBranchOutline, documentTextOutline,
  menuOutline, chevronDownOutline, constructOutline, hardwareChipOutline,
  terminalOutline
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
      <ion-toolbar class="help-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <span class="toolbar-brand-dot"></span>
            Ayuda & Manual de Usuario
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <main class="help-main" id="main-content" role="main">

        <!-- Cabecera de ayuda editorial (Taste Skill) -->
        <header class="help-header" aria-label="Cabecera del manual de usuario">
          <div class="header-symbol" aria-hidden="true">
            <ion-icon name="book-outline"></ion-icon>
          </div>
          <h1 class="help-title">Manual de Operaciones & Arquitectura</h1>
          <p class="help-desc">
            Documentación técnica oficial de EnterpriseHub PWA • Módulo Desarrollo de Interfaces (0488)
          </p>
          <div class="tech-stack" role="list" aria-label="Pila tecnológica">
            <span role="listitem" class="tech-chip">Ionic 9 Standalone</span>
            <span role="listitem" class="tech-chip">Angular 22 OnPush</span>
            <span role="listitem" class="tech-chip">TypeScript 6 Strict</span>
            <span role="listitem" class="tech-chip">RxJS 7 forkJoin</span>
            <span role="listitem" class="tech-chip">Chart.js Telemetría</span>
            <span role="listitem" class="tech-chip">jsPDF & AutoTable</span>
            <span role="listitem" class="tech-chip">WCAG 2.1 AA</span>
          </div>
        </header>

        <!-- Acordeón con secciones de ayuda -->
        <ion-accordion-group [multiple]="true" class="help-accordion">

          <!-- Credenciales de acceso -->
          <ion-accordion value="credentials" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="key-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Credenciales de Demostración</h2>
                <p>Cuentas preconfiguradas con control RBAC por roles</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <div class="credentials-grid">
                <div class="cred-card cred-admin">
                  <div class="cred-card__header">
                    <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
                    <strong>Administrador de Sistema</strong>
                    <span class="role-badge role-admin">ADMIN</span>
                  </div>
                  <table class="cred-table" aria-label="Credenciales de administrador">
                    <tbody>
                      <tr><td>Email:</td><td><code>admin&#64;enterprise.io</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>Admin123!</code></td></tr>
                      <tr><td>Acceso:</td><td>Dashboard completo, Tickets y Ayuda</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="cred-card cred-user">
                  <div class="cred-card__header">
                    <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                    <strong>Operador de Soporte</strong>
                    <span class="role-badge role-user">USER</span>
                  </div>
                  <table class="cred-table" aria-label="Credenciales de usuario">
                    <tbody>
                      <tr><td>Email:</td><td><code>user&#64;enterprise.io</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>User123!</code></td></tr>
                      <tr><td>Acceso:</td><td>Gestión de Tickets y Ayuda</td></tr>
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
                <h2>Arquitectura de Software y Patrones</h2>
                <p>Estructura modular, reactiva y desacoplada</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <h3 class="arch-subtitle">Estructura de Carpetas (Clean Architecture)</h3>
              <pre class="code-block" tabindex="0"><code>src/app/
├── core/                  # Módulos transversales y lógicos
│   ├── guards/            # authGuard y roleGuard (RBAC)
│   ├── models/            # Interfaces de dominio (Ticket, Metric, User)
│   └── services/          # AuthService, SqlMockService, NoSqlMockService, ExportService
├── pages/                 # Vistas lazy con componentes standalone
│   ├── login/             # Formulario reactivo y autenticación
│   ├── register/          # Formulario reactivo con validador asíncrono debounced
│   ├── dashboard/         # Métricas forkJoin, Chart.js telemetría y exportación
│   ├── tickets/           # CRUD de incidencias con modal reactivo
│   └── help/              # Manual integrado y documentación
├── shared/components/     # Componentes desacoplados OnPush
│   ├── data-table/        # Tabla agnóstica con ordenación, paginación y WAI-ARIA
│   └── metric-card/       # Widget KPI tipográfico anti-slop
└── shell.component.ts     # Split-pane y navegación persistente</code></pre>

              <div class="arch-section">
                <h3 class="arch-subtitle">Aspectos Técnicos Clave Cumplidos</h3>
                <ul class="arch-list">
                  <li><strong>RA 1:</strong> Componentes standalone Ionic 8 + Angular con carga perezosa (<code>loadComponent</code>), tipografía modular y guardias RBAC funcionales.</li>
                  <li><strong>RA 2:</strong> Formularios reactivos rigurosos en Login y Registro con <code>uniqueEmailValidator</code> debounced (<code>timer(300)</code>).</li>
                  <li><strong>RA 3:</strong> Componentes <code>DataTableComponent</code> y <code>MetricCardComponent</code> con <code>ChangeDetectionStrategy.OnPush</code> y ciclo de vida limpio (<code>OnDestroy</code>).</li>
                  <li><strong>RA 4:</strong> Accesibilidad WCAG 2.1 AA/AAA validada en contrastes, semántica ARIA (<code>role="grid"</code>, <code>aria-live</code>) y navegación completa por teclado.</li>
                  <li><strong>RA 5:</strong> Concurrencia real con <code>forkJoin</code> integrando datos SQL simulados y telemetría NoSQL en tiempo real, más exportación a CSV y PDF.</li>
                  <li><strong>RA 6:</strong> Manual de usuario embebido en la aplicación y generación de documentación técnica con Compodoc.</li>
                  <li><strong>RA 7:</strong> Flujo Git Flow profesional con ramas modulares, historial limpio y despliegue SPA en Vercel.</li>
                </ul>
              </div>
            </div>
          </ion-accordion>

          <!-- Comandos y Despliegue -->
          <ion-accordion value="deploy" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="git-branch-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Comandos de Ejecución y Despliegue</h2>
                <p>Ciclo de vida del proyecto e integración continua</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <h3 class="arch-subtitle">Comandos de Desarrollo</h3>
              <pre class="code-block" tabindex="0"><code># 1. Instalación de dependencias
npm install

# 2. Servidor local con Hot Reload
npm start          # http://localhost:4200

# 3. Compilación de producción
npm run build      # Artefacto en /www

# 4. Generación de documentación Compodoc
npm run compodoc   # Servidor en http://localhost:8080</code></pre>

              <h3 class="arch-subtitle" style="margin-top:16px;">Estructura Git Flow del Proyecto</h3>
              <pre class="code-block" tabindex="0"><code>main (v1.0.0)             # Versión de producción estable
└── develop               # Rama principal de integración
    ├── feature/core-auth-rbac
    ├── feature/reactive-forms-validation
    ├── feature/reusable-ui-components
    ├── feature/dashboard-reports-export
    ├── feature/wcag-accessibility-docs
    └── feature/taste-skill-frontend-refactor</code></pre>
            </div>
          </ion-accordion>

        </ion-accordion-group>

        <!-- Footer -->
        <footer class="help-footer" role="contentinfo">
          <p>
            <strong>EnterpriseHub PWA</strong> • Consola de Gestión Multiplataforma B2B<br>
            Módulo: Desarrollo de Interfaces (0488) • 2º DAM • Instituto Nebrija de Formación Profesional
          </p>
        </footer>

      </main>
    </ion-content>
  `,
  styles: [`
    .help-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border);
    }
    .toolbar-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      letter-spacing: -0.01em;
    }
    .toolbar-brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-accent);
    }

    .help-main {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }

    /* Cabecera editorial */
    .help-header {
      text-align: center;
      padding: 16px 12px 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .header-symbol {
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
    .help-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .help-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0 0 16px;
    }

    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }
    .tech-chip {
      background: var(--surface-card);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      font-size: 0.71875rem;
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 6px;
    }

    /* Accordion */
    .help-accordion {
      margin-bottom: 24px;
    }
    .accordion-header {
      --background: var(--surface-card);
      --border-color: var(--color-border);
      font-size: 0.875rem;
    }
    .accordion-header ion-icon {
      color: var(--color-text-secondary);
      font-size: 1.15rem;
    }
    .accordion-header h2 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 2px;
    }
    .accordion-header p {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .accordion-content {
      padding: 20px;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--color-border);
    }

    /* Credentials */
    .credentials-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 640px) {
      .credentials-grid { grid-template-columns: 1fr; }
    }
    .cred-card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 14px 16px;
      border: 1px solid var(--color-border);
    }
    .cred-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      margin-bottom: 10px;
      color: var(--color-text-primary);
    }
    .role-badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .role-admin {
      background: rgba(15, 23, 42, 0.08);
      color: #0f172a;
      border: 1px solid rgba(15, 23, 42, 0.2);
    }
    .role-user {
      background: rgba(37, 99, 235, 0.08);
      color: #2563eb;
      border: 1px solid rgba(37, 99, 235, 0.2);
    }
    .cred-table {
      width: 100%;
      font-size: 0.8125rem;
      border-collapse: collapse;
    }
    .cred-table td {
      padding: 4px 0;
      color: var(--color-text-secondary);
    }
    .cred-table td:first-child {
      font-weight: 500;
      width: 90px;
    }
    .cred-table code {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      background: var(--surface-ground);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    /* Architecture */
    .code-block {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      font-size: 0.78125rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      font-family: var(--font-mono);
      margin: 0;
      border: 1px solid #1e293b;
    }
    .arch-subtitle {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 10px;
      letter-spacing: -0.01em;
    }
    .arch-section { margin-top: 20px; }
    .arch-list {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.8;
      padding-left: 20px;
    }
    .arch-list li { margin-bottom: 4px; }
    .arch-list strong { color: var(--color-text-primary); }

    /* Footer */
    .help-footer {
      text-align: center;
      padding: 24px 16px;
      font-size: 0.75rem;
      color: var(--color-text-disabled);
      line-height: 1.6;
      border-top: 1px solid var(--color-border);
      margin-top: 20px;
    }
  `]
})
export class HelpPage {}
