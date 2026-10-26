/**
 * @file help.page.ts
 * @description Manual de Operaciones, Arquitectura y Enlaces Oficiales de Entrega (HelpPage).
 * - Único botón de menú en cabecera (sin duplicados).
 * - Tarjetas directas de acceso a Vercel (Producción) y GitHub (Repositorios oficiales).
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonIcon, IonAccordion, IonAccordionGroup, IonItem, IonLabel, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline, informationCircleOutline, accessibilityOutline,
  codeSlashOutline, serverOutline, shieldCheckmarkOutline,
  helpCircleOutline, keyOutline, peopleOutline, ticketOutline,
  statsChartOutline, gitBranchOutline, documentTextOutline,
  menuOutline, chevronDownOutline, constructOutline, hardwareChipOutline,
  terminalOutline, globeOutline, logoGithub, openOutline
} from 'ionicons/icons';

addIcons({
  bookOutline, informationCircleOutline, accessibilityOutline,
  codeSlashOutline, serverOutline, shieldCheckmarkOutline,
  helpCircleOutline, keyOutline, peopleOutline, ticketOutline,
  statsChartOutline, gitBranchOutline, documentTextOutline,
  menuOutline, chevronDownOutline, constructOutline, hardwareChipOutline,
  terminalOutline, globeOutline, logoGithub, openOutline
});

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonIcon, IonAccordion, IonAccordionGroup, IonItem, IonLabel,
  ],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar class="help-toolbar">
        <ion-buttons slot="start">
          <button
            type="button"
            class="single-menu-btn"
            (click)="toggleDrawer()"
            aria-label="Abrir menú de navegación"
          >
            <ion-icon name="menu-outline"></ion-icon>
            <span>Menú</span>
          </button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <span class="toolbar-brand-dot"></span>
            <span>Manual de Operaciones & Enlaces Oficiales</span>
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <main class="help-main" id="main-content" role="main">

        <header class="help-header" aria-label="Cabecera del manual de usuario">
          <div class="header-symbol" aria-hidden="true">
            <ion-icon name="book-outline"></ion-icon>
          </div>
          <h1 class="help-title">Manual de Operaciones, RBAC & Arquitectura</h1>
          <p class="help-desc">
            Documentación técnica oficial de EnterpriseHub PWA · Módulo Desarrollo de Interfaces (0488) · Autor: Luis Lázaro Pimentel
          </p>

          <!-- Tarjetas de Enlaces Directos de Entrega -->
          <div class="official-links-grid">
            <a href="https://enterprise-hub-di-mauve.vercel.app" target="_blank" rel="noopener noreferrer" class="official-link-card vercel-card">
              <ion-icon name="globe-outline"></ion-icon>
              <div class="link-text">
                <strong>Aplicación Desplegada en Producción (Vercel)</strong>
                <span>https://enterprise-hub-di-mauve.vercel.app</span>
              </div>
              <ion-icon name="open-outline" class="ext-arrow"></ion-icon>
            </a>

            <a href="https://github.com/Thepimen/enterprise-hub-pwa" target="_blank" rel="noopener noreferrer" class="official-link-card">
              <ion-icon name="logo-github"></ion-icon>
              <div class="link-text">
                <strong>Repositorio GitHub Principal (PWA)</strong>
                <span>https://github.com/Thepimen/enterprise-hub-pwa</span>
              </div>
              <ion-icon name="open-outline" class="ext-arrow"></ion-icon>
            </a>

            <a href="https://github.com/Thepimen/enterprise-hub-di" target="_blank" rel="noopener noreferrer" class="official-link-card">
              <ion-icon name="logo-github"></ion-icon>
              <div class="link-text">
                <strong>Repositorio GitHub Espejo (Módulo 0488 DI)</strong>
                <span>https://github.com/Thepimen/enterprise-hub-di</span>
              </div>
              <ion-icon name="open-outline" class="ext-arrow"></ion-icon>
            </a>
          </div>
        </header>

        <ion-accordion-group [multiple]="true" [value]="['credentials', 'architecture']" class="help-accordion">

          <ion-accordion value="credentials" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="key-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Credenciales de Laboratorio RBAC (Signals + Functional Guards)</h2>
                <p>Cuentas multinivel con persistencia en sessionStorage ('DAM2_AUTH_SESSION')</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <div class="credentials-grid">
                <div class="cred-card">
                  <div class="cred-card__header">
                    <ion-icon name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
                    <strong>Administrador NOC</strong>
                    <span class="role-badge role-admin">rol: 'admin'</span>
                  </div>
                  <table class="cred-table">
                    <tbody>
                      <tr><td>Usuario:</td><td><code>admin</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>123</code></td></tr>
                      <tr><td>Ruta Destino:</td><td><code>/admin</code> (Consola NOC)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="cred-card">
                  <div class="cred-card__header">
                    <ion-icon name="people-outline" aria-hidden="true"></ion-icon>
                    <strong>Operador de Soporte L1</strong>
                    <span class="role-badge role-user">rol: 'user'</span>
                  </div>
                  <table class="cred-table">
                    <tbody>
                      <tr><td>Usuario:</td><td><code>operador</code></td></tr>
                      <tr><td>Contraseña:</td><td><code>123</code></td></tr>
                      <tr><td>Ruta Destino:</td><td><code>/user-dashboard</code> (Workstation L1)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ion-accordion>

          <ion-accordion value="architecture" toggleIconSlot="end">
            <ion-item slot="header" class="accordion-header">
              <ion-icon name="code-slash-outline" slot="start" aria-hidden="true"></ion-icon>
              <ion-label>
                <h2>Arquitectura de Control de Acceso y Mejoras Aplicadas</h2>
                <p>Angular Signals, Web Storage API, UrlTree y Diseño Bento NOC</p>
              </ion-label>
            </ion-item>
            <div slot="content" class="accordion-content">
              <ul class="arch-list">
                <li><strong>AuthService con Signals:</strong> Estado reactivo privado <code>_currentUser = signal&lt;UserSession | null&gt;()</code> expuesto como <code>asReadonly()</code> y <code>isAuthenticated = computed()</code>.</li>
                <li><strong>Persistencia Web Storage API:</strong> Hidratación automática desde <code>sessionStorage.getItem('DAM2_AUTH_SESSION')</code> con bloque seguro <code>try/catch</code>.</li>
                <li><strong>Functional Guards con UrlTree:</strong> <code>authGuard</code> y factoría <code>roleGuard(allowedRole)</code> con redirecciones atómicas sin parpadeos visuales.</li>
                <li><strong>Auditoría SRE en Tiempo Real:</strong> Registro automático de cada evaluación de guardas (<code>ALLOWED</code> / <code>DENIED_REDIRECT</code>).</li>
              </ul>
            </div>
          </ion-accordion>

        </ion-accordion-group>
      </main>
    </ion-content>
  `,
  styles: [`
    .help-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border-strong);
      padding: 0 12px;
      min-height: 60px;
    }
    .single-menu-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 38px;
      padding: 0 14px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .single-menu-btn ion-icon {
      font-size: 1.15rem;
      color: var(--color-primary-light);
    }
    .toolbar-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }
    .toolbar-brand-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--color-primary-light);
    }
    .help-main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 20px 56px;
    }
    .help-header {
      text-align: center;
      padding: 16px 12px 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .header-symbol {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border-strong);
      color: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 1.45rem;
    }
    .help-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0 0 6px;
    }
    .help-desc {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin: 0 0 20px;
    }
    .official-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
      text-align: left;
    }
    .official-link-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px solid var(--color-border-strong);
      text-decoration: none;
      color: var(--color-text-primary);
    }
    .official-link-card:hover {
      border-color: var(--color-primary-light);
    }
    .vercel-card {
      background: var(--badge-admin-bg);
      border-color: var(--badge-admin-border);
    }
    .official-link-card ion-icon {
      font-size: 1.4rem;
      color: var(--color-primary-light);
      flex-shrink: 0;
    }
    .link-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow: hidden;
    }
    .link-text strong {
      font-size: 0.82rem;
      color: var(--color-text-primary);
    }
    .link-text span {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--color-primary-light);
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .accordion-header {
      --background: var(--surface-card);
      --border-color: var(--color-border);
    }
    .accordion-header h2 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .accordion-header p {
      font-size: 0.76rem;
      color: var(--color-text-secondary);
    }
    .accordion-content {
      padding: 20px;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--color-border);
    }
    .credentials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .cred-card {
      background: var(--surface-card);
      border-radius: 10px;
      padding: 14px 16px;
      border: 1px solid var(--color-border);
    }
    .cred-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      margin-bottom: 10px;
      color: var(--color-text-primary);
    }
    .role-badge {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .role-admin {
      background: var(--badge-admin-bg);
      color: var(--badge-admin-text);
      border: 1px solid var(--badge-admin-border);
    }
    .role-user {
      background: var(--badge-user-bg);
      color: var(--badge-user-text);
      border: 1px solid var(--badge-user-border);
    }
    .cred-table {
      width: 100%;
      font-size: 0.82rem;
    }
    .cred-table td {
      padding: 4px 0;
      color: var(--color-text-secondary);
    }
    .cred-table code {
      font-family: var(--font-mono);
      background: var(--surface-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-primary);
    }
    .arch-list {
      font-size: 0.84rem;
      color: var(--color-text-secondary);
      line-height: 1.75;
      padding-left: 20px;
      margin: 0;
    }
    .arch-list strong { color: var(--color-text-primary); }
  `]
})
export class HelpPage {
  private readonly menuCtrl = inject(MenuController);

  async toggleDrawer(): Promise<void> {
    await this.menuCtrl.toggle('main-menu');
  }
}
