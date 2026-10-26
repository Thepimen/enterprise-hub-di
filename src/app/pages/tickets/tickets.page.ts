/**
 * @file tickets.page.ts
 * @description Centro de Incidencias (TicketsPage) accesible para ADMIN y USER.
 * - Único botón de menú lateral en cabecera (sin duplicados).
 * - Píldoras de filtro interactivo por estado y prioridad.
 * - Tabla desacoplada OnPush con acciones funcionales.
 */
import {
  Component, OnInit, OnDestroy, inject,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonSpinner, IonModal,
  IonInput, IonSelect, IonSelectOption, IonTextarea,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent, IonFab, IonFabButton, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, closeOutline, ticketOutline, refreshOutline,
  eyeOutline, createOutline, funnelOutline, menuOutline,
  filterOutline, checkmarkCircleOutline, alertCircleOutline,
  timeOutline, lockClosedOutline, chevronDownOutline, sunnyOutline, moonOutline
} from 'ionicons/icons';
import { SqlMockService } from '../../core/services/sql-mock.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DataTableComponent, RowAction } from '../../shared/components/data-table/data-table.component';
import { Ticket, CreateTicketPayload, TableColumn } from '../../core/models/ticket.model';

addIcons({
  addOutline, closeOutline, ticketOutline, refreshOutline,
  eyeOutline, createOutline, funnelOutline, menuOutline,
  filterOutline, checkmarkCircleOutline, alertCircleOutline,
  timeOutline, lockClosedOutline, chevronDownOutline, sunnyOutline, moonOutline
});

@Component({
  selector: 'app-tickets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, DataTableComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonSpinner, IonModal,
    IonInput, IonSelect, IonSelectOption, IonTextarea,
    IonGrid, IonRow, IonCol,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton,
  ],
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar class="tickets-toolbar">
        <ion-buttons slot="start">
          <!-- ÚNICO BOTÓN DE MENÚ -->
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
            <span>Centro de Incidencias Técnicas</span>
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <button
            type="button"
            class="theme-chip-btn"
            (click)="authService.toggleTheme()"
            title="Alternar tema Oscuro / Claro"
          >
            <ion-icon [name]="authService.theme() === 'dark' ? 'sunny-outline' : 'moon-outline'"></ion-icon>
          </button>
          <ion-button
            (click)="loadTickets()"
            fill="clear"
            aria-label="Actualizar lista de tickets"
            title="Refrescar lista"
            class="header-action-btn"
          >
            <ion-icon name="refresh-outline" aria-hidden="true"></ion-icon>
          </ion-button>
          <button
            (click)="openModal()"
            class="primary-create-btn"
            aria-label="Registrar nuevo ticket"
          >
            <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
            <span>Nuevo Ticket</span>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="tickets-main" id="main-content" role="main">

        <header class="tickets-header" aria-label="Estadísticas de tickets">
          <div>
            <div class="header-breadcrumbs">
              <span class="bc-root">Operaciones SRE</span>
              <span class="bc-sep">/</span>
              <span class="bc-current">Gestión de Incidencias ({{ authService.currentUser()?.username }} · {{ authService.currentUser()?.role | uppercase }})</span>
            </div>
            <h1 class="tickets-title">Centro de Incidencias & SLA</h1>
            <p class="tickets-subtitle">Haz clic en cualquier píldora de estado para filtrar instantáneamente la tabla</p>
          </div>

          <div class="ticket-stats" role="group" aria-label="Filtros por estado de tickets">
            <button
              type="button"
              class="stat-pill"
              [class.active]="activeStatusFilter === 'ALL'"
              (click)="applyFilter('ALL')"
            >
              <span class="stat-label">Todos</span>
              <span class="stat-count">{{ allTickets.length }}</span>
            </button>
            <button
              *ngFor="let stat of stats"
              type="button"
              class="stat-pill"
              [class.active]="activeStatusFilter === stat.key"
              (click)="applyFilter(stat.key)"
              [attr.aria-label]="stat.label + ': ' + stat.count"
            >
              <span class="stat-indicator" [class]="'ind--' + stat.color" aria-hidden="true"></span>
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-count">{{ stat.count }}</span>
            </button>
          </div>
        </header>

        <div *ngIf="isLoading" class="loading-block" role="status" aria-live="polite">
          <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
          <span>Consultando repositorio de incidencias...</span>
        </div>

        <section *ngIf="!isLoading" aria-label="Tabla de tickets técnicos">
          <app-data-table
            [data]="tickets"
            [columns]="columns"
            [pageSize]="8"
            [loading]="isLoading"
            [actions]="tableActions"
            ariaLabel="Tabla de tickets técnicos del sistema"
            (rowSelected)="onRowSelected($event)"
            (actionTriggered)="onAction($event)"
          ></app-data-table>
        </section>
      </main>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" aria-label="Crear nuevo ticket">
        <ion-fab-button (click)="openModal()" color="primary" aria-label="Abrir formulario de nuevo ticket">
          <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-modal
      [isOpen]="isModalOpen"
      (didDismiss)="closeModal()"
      [initialBreakpoint]="0.9"
      [breakpoints]="[0, 0.5, 0.9]"
      aria-label="Modal para crear nuevo ticket"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar class="modal-toolbar">
            <ion-title>Registrar Nueva Incidencia</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeModal()" aria-label="Cerrar modal de creación de ticket">
                <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="modal-content">
          <form [formGroup]="ticketForm" (ngSubmit)="onSubmit()" novalidate class="ticket-form">
            <div class="form-field">
              <label for="tkt-title" class="form-label">Título de la incidencia *</label>
              <ion-input
                id="tkt-title"
                formControlName="title"
                placeholder="Descripción breve del problema"
                [class.input-error]="isInvalid('title')"
                aria-required="true"
                class="modal-input"
              ></ion-input>
              <p *ngIf="isInvalid('title')" role="alert" class="form-error">El título es obligatorio (mínimo 5 caracteres).</p>
            </div>

            <div class="form-field">
              <label for="tkt-desc" class="form-label">Detalle técnico *</label>
              <ion-textarea
                id="tkt-desc"
                formControlName="description"
                placeholder="Pasos para reproducir, servicios afectados y comportamiento observado..."
                [rows]="4"
                [class.input-error]="isInvalid('description')"
                aria-required="true"
                class="modal-input modal-textarea"
              ></ion-textarea>
              <p *ngIf="isInvalid('description')" role="alert" class="form-error">
                La descripción debe tener al menos 10 caracteres.
              </p>
            </div>

            <ion-grid class="form-grid">
              <ion-row>
                <ion-col size="12" size-sm="6">
                  <div class="form-field">
                    <label for="tkt-priority" class="form-label">Nivel de Prioridad *</label>
                    <ion-select
                      id="tkt-priority"
                      formControlName="priority"
                      placeholder="Seleccionar prioridad"
                      aria-required="true"
                      interface="popover"
                      class="modal-select"
                    >
                      <ion-select-option value="LOW">Baja (Sin impacto crítico)</ion-select-option>
                      <ion-select-option value="MEDIUM">Media (Impacto moderado)</ion-select-option>
                      <ion-select-option value="HIGH">Alta (Degradación de servicio)</ion-select-option>
                      <ion-select-option value="CRITICAL">Crítica (Interrupción total)</ion-select-option>
                    </ion-select>
                  </div>
                </ion-col>
                <ion-col size="12" size-sm="6">
                  <div class="form-field">
                    <label for="tkt-category" class="form-label">Categoría del Sistema *</label>
                    <ion-select
                      id="tkt-category"
                      formControlName="category"
                      placeholder="Seleccionar categoría"
                      aria-required="true"
                      interface="popover"
                      class="modal-select"
                    >
                      <ion-select-option value="HARDWARE">Infraestructura & Hardware</ion-select-option>
                      <ion-select-option value="SOFTWARE">Aplicación & Software</ion-select-option>
                      <ion-select-option value="NETWORK">Conectividad & Red</ion-select-option>
                      <ion-select-option value="SECURITY">Ciberseguridad & Acceso</ion-select-option>
                      <ion-select-option value="OTHER">General & Otras peticiones</ion-select-option>
                    </ion-select>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <div class="form-actions">
              <button type="button" class="modal-btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="modal-btn-submit" [disabled]="ticketForm.invalid || isSaving">
                <ion-spinner *ngIf="isSaving" name="crescent" aria-hidden="true"></ion-spinner>
                <span *ngIf="!isSaving">Crear Ticket</span>
              </button>
            </div>
          </form>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .tickets-toolbar {
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
    .theme-chip-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--surface-elevated);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .header-action-btn {
      --color: var(--color-text-secondary);
    }
    .primary-create-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: #ffffff;
      border: 1px solid var(--btn-primary-border);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      margin-right: 4px;
    }

    .tickets-main {
      max-width: 1380px;
      margin: 0 auto;
      padding: 24px 20px 56px;
    }
    .tickets-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 24px;
    }
    .header-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }
    .bc-sep { color: var(--color-text-disabled); }
    .bc-current { color: var(--color-primary-light); font-weight: 700; }
    .tickets-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .tickets-subtitle {
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .ticket-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-card);
      border: 1px solid var(--color-border-strong);
      border-radius: 999px;
      padding: 7px 14px;
      cursor: pointer;
      color: var(--color-text-primary);
    }
    .stat-pill.active {
      background: var(--btn-primary-bg);
      border-color: var(--btn-primary-border);
      color: #ffffff;
    }
    .stat-pill.active .stat-label,
    .stat-pill.active .stat-count {
      color: #ffffff;
    }
    .stat-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .ind--red    { background: #ef4444; }
    .ind--orange { background: #f59e0b; }
    .ind--green  { background: #10b981; }
    .ind--gray   { background: #64748b; }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    .stat-count {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--color-text-primary);
      font-family: var(--font-mono);
    }

    .loading-block {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 48px;
      color: var(--color-text-secondary);
    }

    .modal-toolbar {
      --background: var(--surface-card);
      border-bottom: 1px solid var(--color-border);
    }
    .modal-content {
      --background: var(--surface-card);
      --padding-start: 20px;
      --padding-end: 20px;
    }
    .ticket-form { padding: 18px 0; }
    .form-field { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 5px;
    }
    .modal-input {
      --border-radius: 8px;
      --background: var(--surface-elevated);
      --color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      border-radius: 8px;
      font-size: 0.875rem;
      min-height: 40px;
    }
    .modal-textarea { min-height: 90px; }
    .modal-select {
      border: 1px solid var(--color-border-strong);
      border-radius: 8px;
      background: var(--surface-elevated);
      font-size: 0.875rem;
    }
    .form-grid { padding: 0; }
    .form-error { color: #ef4444; font-size: 0.75rem; margin: 4px 0 0; }
    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }
    .modal-btn-cancel {
      padding: 8px 14px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: 1px solid var(--color-border-strong);
      color: var(--color-text-primary);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }
    .modal-btn-submit {
      padding: 8px 16px;
      border-radius: 8px;
      background: var(--btn-primary-bg);
      color: #ffffff;
      border: 1px solid var(--btn-primary-border);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class TicketsPage implements OnInit, OnDestroy {
  private readonly sqlService = inject(SqlMockService);
  readonly authService = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly menuCtrl = inject(MenuController);
  private readonly destroy$ = new Subject<void>();

  allTickets: Ticket[] = [];
  tickets: Record<string, unknown>[] = [];
  activeStatusFilter = 'ALL';
  isLoading = false;
  isModalOpen = false;
  isSaving = false;
  ticketForm!: FormGroup;
  stats: { key: string; label: string; count: number; color: string }[] = [];

  readonly columns: TableColumn[] = [
    { key: 'id',       label: 'ID',       sortable: false },
    { key: 'title',    label: 'Título',   sortable: true  },
    { key: 'status',   label: 'Estado',   sortable: true  },
    { key: 'priority', label: 'Prioridad', sortable: true },
    { key: 'category', label: 'Categoría', sortable: false },
    { key: 'createdAt', label: 'Fecha',   sortable: true  },
  ];

  readonly tableActions: RowAction[] = [
    { key: 'view',   label: 'Ver detalle', icon: 'eye-outline' },
    { key: 'edit',   label: 'Editar',      icon: 'create-outline' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async toggleDrawer(): Promise<void> {
    await this.menuCtrl.toggle('main-menu');
  }

  loadTickets(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.sqlService.getTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allTickets = data;
          this.computeStats(data);
          this.applyFilter(this.activeStatusFilter);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.notif.error('Error al cargar la lista de tickets.');
          this.cdr.markForCheck();
        },
      });
  }

  applyFilter(statusKey: string): void {
    this.activeStatusFilter = statusKey;
    const filtered = statusKey === 'ALL'
      ? this.allTickets
      : this.allTickets.filter((t) => t.status === statusKey);
    this.tickets = filtered as unknown as Record<string, unknown>[];
    this.cdr.markForCheck();
  }

  onRefresh(event: CustomEvent): void {
    this.loadTickets();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 800);
  }

  openModal(): void {
    this.initForm();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.ticketForm.reset();
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;

    const payload: CreateTicketPayload = this.ticketForm.value;
    const author = this.authService.currentUser()?.username ?? 'Usuario';

    this.sqlService.createTicket(payload, author)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newTicket) => {
          this.isSaving = false;
          this.closeModal();
          this.notif.success(`Ticket ${newTicket.id} registrado correctamente.`);
          this.loadTickets();
        },
        error: () => {
          this.isSaving = false;
          this.notif.error('Error al crear el ticket.');
          this.cdr.markForCheck();
        },
      });
  }

  onRowSelected(row: Record<string, unknown>): void {
    this.notif.info(`Ticket seleccionado: [${row['id']}] ${row['title']}`);
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    const { action, row } = event;
    if (action === 'view') {
      this.notif.info(`Detalles de ${row['id']}: ${row['description'] ?? row['title']}`);
    } else if (action === 'edit') {
      this.notif.info(`Acción de edición para ${row['id']}.`);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.ticketForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private initForm(): void {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['MEDIUM', Validators.required],
      category: ['SOFTWARE', Validators.required],
    });
  }

  private computeStats(tickets: Ticket[]): void {
    this.stats = [
      { key: 'OPEN',        label: 'Abiertos',    count: tickets.filter((t) => t.status === 'OPEN').length,        color: 'red' },
      { key: 'IN_PROGRESS', label: 'En progreso', count: tickets.filter((t) => t.status === 'IN_PROGRESS').length, color: 'orange' },
      { key: 'RESOLVED',    label: 'Resueltos',   count: tickets.filter((t) => t.status === 'RESOLVED').length,    color: 'green' },
      { key: 'CLOSED',      label: 'Cerrados',    count: tickets.filter((t) => t.status === 'CLOSED').length,      color: 'gray' },
    ];
  }
}
