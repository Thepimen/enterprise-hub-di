/**
 * @file tickets.page.ts
 * @description Página de gestión de tickets accesible para ADMIN y USER.
 * Muestra DataTable reutilizable y permite crear nuevos tickets mediante modal reactivo.
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
  IonMenuButton, IonButton, IonIcon, IonSpinner, IonModal,
  IonInput, IonSelect, IonSelectOption, IonTextarea,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, closeOutline, ticketOutline, refreshOutline,
  eyeOutline, createOutline, funnelOutline, menuOutline,
  filterOutline, checkmarkCircleOutline, alertCircleOutline,
  timeOutline, lockClosedOutline, chevronDownOutline
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
  timeOutline, lockClosedOutline, chevronDownOutline
});

@Component({
  selector: 'app-tickets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, DataTableComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonMenuButton, IonButton, IonIcon, IonSpinner, IonModal,
    IonInput, IonSelect, IonSelectOption, IonTextarea,
    IonGrid, IonRow, IonCol,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <span class="toolbar-title">
            <ion-icon name="ticket-outline" aria-hidden="true"></ion-icon>
            Tickets Técnicos
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="loadTickets()"
            fill="clear"
            aria-label="Actualizar lista de tickets"
          >
            <ion-icon name="refresh-outline" aria-hidden="true"></ion-icon>
          </ion-button>
          <ion-button
            (click)="openModal()"
            fill="solid"
            color="primary"
            aria-label="Crear nuevo ticket"
          >
            <ion-icon name="add-outline" slot="start" aria-hidden="true"></ion-icon>
            Nuevo
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" aria-label="Desliza para actualizar">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="tickets-main" id="main-content" role="main">

        <!-- Cabecera con estadísticas -->
        <section class="tickets-header" aria-label="Estadísticas de tickets">
          <h1 class="tickets-title">Centro de Incidencias</h1>
          <div class="ticket-stats" role="group" aria-label="Resumen de estado de tickets">
            <div *ngFor="let stat of stats" class="stat-item" [attr.aria-label]="stat.label + ': ' + stat.count">
              <span class="stat-count" [class]="'stat-count--' + stat.color">{{ stat.count }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </section>

        <!-- Loading -->
        <div *ngIf="isLoading" class="loading-block" role="status" aria-live="polite">
          <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
          <span>Cargando tickets...</span>
        </div>

        <!-- DataTable reutilizable -->
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

      <!-- FAB para crear ticket (mobile) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" aria-label="Crear nuevo ticket">
        <ion-fab-button (click)="openModal()" color="primary" aria-label="Abrir formulario de nuevo ticket">
          <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- ==================== MODAL: Nuevo Ticket ==================== -->
    <ion-modal
      [isOpen]="isModalOpen"
      (didDismiss)="closeModal()"
      [initialBreakpoint]="0.9"
      [breakpoints]="[0, 0.5, 0.9]"
      aria-label="Modal para crear nuevo ticket"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
              Nuevo Ticket
            </ion-title>
            <ion-buttons slot="end">
              <ion-button
                (click)="closeModal()"
                fill="clear"
                aria-label="Cerrar modal de creación de ticket"
              >
                <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="modal-content">
          <form
            [formGroup]="ticketForm"
            (ngSubmit)="submitTicket()"
            novalidate
            class="ticket-form"
            aria-label="Formulario de creación de ticket"
          >

            <!-- Título -->
            <div class="form-field">
              <label for="tkt-title" class="form-label">Título del ticket *</label>
              <ion-input
                id="tkt-title"
                type="text"
                formControlName="title"
                placeholder="Describe brevemente el problema..."
                [class.input-error]="isInvalid('title')"
                aria-required="true"
                class="modal-input"
              ></ion-input>
              <p *ngIf="isInvalid('title')" role="alert" class="form-error">
                El título es obligatorio (mínimo 5 caracteres).
              </p>
            </div>

            <!-- Descripción -->
            <div class="form-field">
              <label for="tkt-desc" class="form-label">Descripción detallada *</label>
              <ion-textarea
                id="tkt-desc"
                formControlName="description"
                placeholder="Describe el problema con detalle, pasos para reproducir, sistemas afectados..."
                [rows]="4"
                [class.input-error]="isInvalid('description')"
                aria-required="true"
                class="modal-input"
              ></ion-textarea>
              <p *ngIf="isInvalid('description')" role="alert" class="form-error">
                La descripción es obligatoria (mínimo 20 caracteres).
              </p>
            </div>

            <!-- Prioridad y Categoría -->
            <ion-grid class="form-grid">
              <ion-row>
                <ion-col size="12" size-sm="6">
                  <div class="form-field">
                    <label for="tkt-priority" class="form-label">Prioridad *</label>
                    <ion-select
                      id="tkt-priority"
                      formControlName="priority"
                      placeholder="Selecciona prioridad"
                      aria-required="true"
                      interface="popover"
                      class="modal-select"
                    >
                      <ion-select-option value="LOW">🟢 Baja</ion-select-option>
                      <ion-select-option value="MEDIUM">🟡 Media</ion-select-option>
                      <ion-select-option value="HIGH">🟠 Alta</ion-select-option>
                      <ion-select-option value="CRITICAL">🔴 Crítica</ion-select-option>
                    </ion-select>
                    <p *ngIf="isInvalid('priority')" role="alert" class="form-error">Selecciona una prioridad.</p>
                  </div>
                </ion-col>
                <ion-col size="12" size-sm="6">
                  <div class="form-field">
                    <label for="tkt-category" class="form-label">Categoría *</label>
                    <ion-select
                      id="tkt-category"
                      formControlName="category"
                      placeholder="Selecciona categoría"
                      aria-required="true"
                      interface="popover"
                      class="modal-select"
                    >
                      <ion-select-option value="HARDWARE">🖥️ Hardware</ion-select-option>
                      <ion-select-option value="SOFTWARE">💾 Software</ion-select-option>
                      <ion-select-option value="NETWORK">🌐 Red</ion-select-option>
                      <ion-select-option value="SECURITY">🔒 Seguridad</ion-select-option>
                      <ion-select-option value="OTHER">📋 Otro</ion-select-option>
                    </ion-select>
                    <p *ngIf="isInvalid('category')" role="alert" class="form-error">Selecciona una categoría.</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <!-- Botones de acción -->
            <div class="form-actions">
              <ion-button
                type="button"
                fill="outline"
                (click)="closeModal()"
                aria-label="Cancelar creación de ticket"
              >
                Cancelar
              </ion-button>
              <ion-button
                type="submit"
                fill="solid"
                [disabled]="ticketForm.invalid || isSaving"
                aria-label="Guardar nuevo ticket"
              >
                <ion-spinner *ngIf="isSaving" name="crescent" aria-hidden="true"></ion-spinner>
                <ion-icon *ngIf="!isSaving" name="checkmark-circle-outline" slot="start" aria-hidden="true"></ion-icon>
                {{ isSaving ? 'Guardando...' : 'Crear Ticket' }}
              </ion-button>
            </div>
          </form>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .tickets-main { padding: 16px; }
    .toolbar-title { display: flex; align-items: center; gap: 8px; font-weight: 700; }
    .tickets-header { margin-bottom: 20px; }
    .tickets-title {
      font-size: 1.4rem; font-weight: 800;
      color: var(--color-text-primary); margin: 0 0 16px;
    }
    .ticket-stats { display: flex; flex-wrap: wrap; gap: 12px; }
    .stat-item {
      display: flex; flex-direction: column; align-items: center;
      background: var(--surface-card); border: 1px solid var(--color-border);
      border-radius: 12px; padding: 12px 20px; min-width: 80px;
    }
    .stat-count {
      font-size: 1.6rem; font-weight: 800; line-height: 1;
      margin-bottom: 4px;
    }
    .stat-count--red    { color: #ef4444; }
    .stat-count--orange { color: #f59e0b; }
    .stat-count--green  { color: #10b981; }
    .stat-count--gray   { color: #6b7280; }
    .stat-label { font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .loading-block {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 48px; color: var(--color-text-secondary);
    }
    /* Modal */
    .modal-content { --padding-start: 16px; --padding-end: 16px; }
    .ticket-form { padding: 16px 0; }
    .form-field { margin-bottom: 18px; }
    .form-label {
      display: block; font-size: 0.82rem; font-weight: 600;
      color: var(--color-text-secondary); margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .modal-input {
      --border-radius: 10px;
      --border-color: var(--color-border);
      --background: var(--surface-ground);
      --color: var(--color-text-primary);
      border: 1px solid var(--color-border); border-radius: 10px;
    }
    .modal-input.input-error { border-color: var(--ion-color-danger) !important; }
    .modal-select {
      --border-radius: 10px;
      border: 1px solid var(--color-border); border-radius: 10px;
      background: var(--surface-ground);
    }
    .form-grid { padding: 0; }
    .form-error { color: var(--ion-color-danger); font-size: 0.78rem; margin: 4px 0 0; }
    .form-actions {
      display: flex; gap: 12px; justify-content: flex-end;
      margin-top: 24px; padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }
  `]
})
export class TicketsPage implements OnInit, OnDestroy {
  private readonly sqlService = inject(SqlMockService);
  private readonly authService = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  tickets: Record<string, unknown>[] = [];
  isLoading = false;
  isModalOpen = false;
  isSaving = false;
  ticketForm!: FormGroup;
  stats: { label: string; count: number; color: string }[] = [];

  readonly columns: TableColumn[] = [
    { key: 'id',       label: 'ID',       sortable: false },
    { key: 'title',    label: 'Título',   sortable: true  },
    { key: 'status',   label: 'Estado',   sortable: true  },
    { key: 'priority', label: 'Prioridad', sortable: true },
    { key: 'category', label: 'Categoría' },
    { key: 'createdAt', label: 'Creado'  },
  ];

  readonly tableActions: RowAction[] = [
    { key: 'view',   label: 'Ver detalle', icon: 'eye-outline',    color: 'primary' },
    { key: 'update', label: 'Actualizar',  icon: 'create-outline', color: 'secondary' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.sqlService.getTickets().pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => {
        // Aplanar las fechas para que DataTable las muestre correctamente
        this.tickets = list.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt).toLocaleDateString('es-ES'),
        })) as Record<string, unknown>[];

        this.buildStats(list);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.notif.error('Error al cargar los tickets.');
        this.cdr.markForCheck();
      },
    });
  }

  openModal(): void {
    this.ticketForm.reset();
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.markForCheck();
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const userId = this.authService.currentUser?.id ?? 'unknown';
    const payload: CreateTicketPayload = {
      title: this.ticketForm.value.title,
      description: this.ticketForm.value.description,
      priority: this.ticketForm.value.priority,
      category: this.ticketForm.value.category,
    };

    this.sqlService.createTicket(payload, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.notif.success('Ticket creado exitosamente.');
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
    this.notif.info(`Ticket seleccionado: ${row['id']} - ${row['title']}`);
  }

  onAction(event: { action: string; row: Record<string, unknown> }): void {
    if (event.action === 'view') {
      this.notif.info(`Ver detalle ticket: ${event.row['id']}`);
    } else if (event.action === 'update') {
      this.notif.warning(`Actualizar ticket: ${event.row['id']}`);
    }
  }

  onRefresh(event: CustomEvent): void {
    this.loadTickets();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 800);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.ticketForm.get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  private initForm(): void {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      priority: ['MEDIUM', Validators.required],
      category: ['SOFTWARE', Validators.required],
    });
  }

  private buildStats(list: Ticket[]): void {
    this.stats = [
      { label: 'Abiertos',    count: list.filter(t => t.status === 'OPEN').length,        color: 'red'    },
      { label: 'En progreso', count: list.filter(t => t.status === 'IN_PROGRESS').length, color: 'orange' },
      { label: 'Resueltos',   count: list.filter(t => t.status === 'RESOLVED').length,    color: 'green'  },
      { label: 'Cerrados',    count: list.filter(t => t.status === 'CLOSED').length,      color: 'gray'   },
    ];
  }
}
