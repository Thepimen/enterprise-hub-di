/**
 * @file data-table.component.ts
 * @description Componente agnóstico y reutilizable de tabla de datos.
 * Refactorizado según las directrices de Taste Skill (app-screens.md §7):
 * - Eliminación de bandas sólidas de cabecera en favor de reglas y alineación precisa
 * - Sin bandas zebra artificiales, números alineados y tipografía sobria
 * - Insignias semánticas discretas con bordes tenues
 * Implementa ChangeDetectionStrategy.OnPush, filtrado reactivo,
 * paginación, accesibilidad WCAG 2.1 AA y navegación por teclado completa.
 */
import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy,
  SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  IonSearchbar, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, chevronForwardOutline, searchOutline,
  createOutline, trashOutline, eyeOutline, funnelOutline
} from 'ionicons/icons';
import { TableColumn } from '../../../core/models/ticket.model';

/** Definición de acción disponible en cada fila */
export interface RowAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    IonSearchbar, IonIcon, IonSpinner,
  ],
  template: `
    <div class="data-table-wrapper" role="region" [attr.aria-label]="ariaLabel">

      <!-- Barra de búsqueda reactiva -->
      <div class="table-controls" role="search">
        <ion-searchbar
          [id]="searchId"
          [(ngModel)]="searchText"
          (ionInput)="onSearchInput($event)"
          placeholder="Filtrar por identificador, título o categoría..."
          [debounce]="300"
          aria-label="Buscar en la tabla de datos"
          class="table-searchbar"
          autocomplete="off"
          role="searchbox"
        ></ion-searchbar>
        <div class="table-meta" aria-live="polite" aria-atomic="true">
          <span class="meta-count">
            {{ filteredData.length }} registro{{ filteredData.length !== 1 ? 's' : '' }}
            <span *ngIf="searchText"> coincidente{{ filteredData.length !== 1 ? 's' : '' }}</span>
          </span>
        </div>
      </div>

      <!-- Spinner durante carga -->
      <div *ngIf="loading" class="table-loading" role="status" aria-live="polite">
        <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
        <span>Consultando registros...</span>
      </div>

      <!-- Sin datos -->
      <div *ngIf="!loading && filteredData.length === 0" class="table-empty" role="status">
        <ion-icon name="funnel-outline" aria-hidden="true"></ion-icon>
        <p>No se encontraron registros{{ searchText ? ' para "' + searchText + '"' : '' }}.</p>
      </div>

      <!-- Tabla de datos (Taste Skill: encabezado con regla sutil, tipografía en frase) -->
      <div *ngIf="!loading && filteredData.length > 0" class="table-container">
        <table
          class="enterprise-table"
          role="grid"
          [attr.aria-label]="ariaLabel"
          [attr.aria-rowcount]="filteredData.length"
        >
          <caption class="sr-only">{{ ariaLabel }} - {{ filteredData.length }} filas</caption>
          <thead>
            <tr role="row">
              <th
                *ngFor="let col of columns; let i = index"
                scope="col"
                role="columnheader"
                [attr.aria-colindex]="i + 1"
                class="table-header-cell"
              >
                {{ col.label }}
              </th>
              <th *ngIf="actions.length > 0" scope="col" class="table-header-cell actions-header">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let row of pagedData; let i = index"
              role="row"
              class="table-row"
              [attr.aria-rowindex]="currentPage * pageSize + i + 1"
              (click)="onRowClick(row)"
              (keydown.enter)="onRowClick(row)"
              (keydown.space)="onRowClick(row)"
              tabindex="0"
              [attr.aria-label]="'Fila ' + (currentPage * pageSize + i + 1) + ': ' + getRowSummary(row)"
            >
              <td
                *ngFor="let col of columns; let ci = index"
                role="gridcell"
                [attr.aria-colindex]="ci + 1"
                class="table-cell"
                [attr.data-label]="col.label"
              >
                <ng-container [ngSwitch]="getCellType(row, col.key)">
                  <span *ngSwitchCase="'status'" [class]="'status-badge status-' + getBadgeClass(row[col.key])">
                    <span class="badge-dot" aria-hidden="true"></span>
                    {{ row[col.key] }}
                  </span>
                  <span *ngSwitchCase="'priority'" [class]="'priority-badge priority-' + getBadgeClass(row[col.key])">
                    {{ row[col.key] }}
                  </span>
                  <span *ngSwitchDefault [class.mono-cell]="col.key === 'id'">{{ formatCellValue(row[col.key]) }}</span>
                </ng-container>
              </td>
              <td *ngIf="actions.length > 0" role="gridcell" class="table-cell actions-cell">
                <div class="action-buttons" role="group" [attr.aria-label]="'Acciones para fila ' + (i + 1)">
                  <button
                    *ngFor="let action of actions"
                    class="action-btn"
                    [attr.aria-label]="action.label + ' fila ' + (i + 1)"
                    [title]="action.label"
                    (click)="onActionClick($event, action.key, row)"
                    (keydown.enter)="onActionClick($event, action.key, row)"
                  >
                    <ion-icon [name]="action.icon" aria-hidden="true"></ion-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación accesible (Taste Skill: controles planos con borde 1px) -->
      <nav
        *ngIf="totalPages > 1"
        class="pagination-nav"
        role="navigation"
        aria-label="Paginación de la tabla"
      >
        <button
          class="page-btn"
          [disabled]="currentPage === 0"
          (click)="goToPage(currentPage - 1)"
          aria-label="Página anterior"
          [attr.aria-disabled]="currentPage === 0"
        >
          <ion-icon name="chevron-back-outline" aria-hidden="true"></ion-icon>
        </button>

        <button
          *ngFor="let page of visiblePages"
          class="page-btn"
          [class.active]="page === currentPage"
          (click)="goToPage(page)"
          [attr.aria-label]="'Página ' + (page + 1)"
          [attr.aria-current]="page === currentPage ? 'page' : null"
        >
          {{ page + 1 }}
        </button>

        <button
          class="page-btn"
          [disabled]="currentPage === totalPages - 1"
          (click)="goToPage(currentPage + 1)"
          aria-label="Página siguiente"
          [attr.aria-disabled]="currentPage === totalPages - 1"
        >
          <ion-icon name="chevron-forward-outline" aria-hidden="true"></ion-icon>
        </button>

        <span class="page-info" aria-live="polite">
          Página {{ currentPage + 1 }} de {{ totalPages }}
        </span>
      </nav>
    </div>
  `,
  styles: [`
    .data-table-wrapper {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .table-controls {
      padding: 12px 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid var(--color-border);
      background: var(--surface-card);
    }
    .table-searchbar {
      --border-radius: 8px;
      --background: var(--surface-ground);
      --box-shadow: none;
      padding: 0;
    }
    .meta-count {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      padding: 0 2px;
    }
    .table-loading, .table-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      gap: 10px;
      color: var(--color-text-secondary);
      font-size: 0.8125rem;
    }
    .table-empty ion-icon {
      font-size: 2.2rem;
      color: var(--color-text-disabled);
    }
    .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .enterprise-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      white-space: nowrap;
      border: 0;
    }

    /* Cabecera sutil sin banda de color estridente (Taste Skill) */
    .table-header-cell {
      background: var(--surface-card);
      color: var(--color-text-secondary);
      padding: 10px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      letter-spacing: -0.01em;
      text-transform: none;
      white-space: nowrap;
      border-bottom: 1px solid var(--color-border);
    }
    .table-row {
      border-bottom: 1px solid var(--color-border);
      transition: background-color 0.1s ease;
      cursor: pointer;
    }
    .table-row:hover, .table-row:focus {
      background: var(--color-hover);
      outline: none;
    }
    .table-row:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }
    .table-cell {
      padding: 11px 16px;
      vertical-align: middle;
      color: var(--color-text-primary);
    }
    .mono-cell {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

    /* Badges semánticos discretos con borde de 1px */
    .status-badge, .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
    }
    .badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }
    .status-open {
      background: rgba(220, 38, 38, 0.06);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
    .status-open .badge-dot { background: #dc2626; }

    .status-in_progress {
      background: rgba(217, 119, 6, 0.06);
      color: #d97706;
      border: 1px solid rgba(217, 119, 6, 0.2);
    }
    .status-in_progress .badge-dot { background: #d97706; }

    .status-resolved {
      background: rgba(5, 150, 105, 0.06);
      color: #059669;
      border: 1px solid rgba(5, 150, 105, 0.2);
    }
    .status-resolved .badge-dot { background: #059669; }

    .status-closed {
      background: rgba(100, 116, 139, 0.06);
      color: #64748b;
      border: 1px solid rgba(100, 116, 139, 0.2);
    }
    .status-closed .badge-dot { background: #64748b; }

    .priority-critical {
      background: rgba(220, 38, 38, 0.08);
      color: #b91c1c;
      border: 1px solid rgba(220, 38, 38, 0.25);
      font-weight: 600;
    }
    .priority-high {
      background: rgba(239, 68, 68, 0.06);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .priority-medium {
      background: rgba(245, 158, 11, 0.06);
      color: #d97706;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .priority-low {
      background: rgba(37, 99, 235, 0.06);
      color: #2563eb;
      border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .actions-header { text-align: center; width: 110px; }
    .actions-cell { text-align: center; }
    .action-buttons { display: flex; gap: 5px; justify-content: center; }
    .action-btn {
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 4px 7px;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
      transition: all 0.12s;
      display: flex;
      align-items: center;
    }
    .action-btn:hover {
      background: var(--color-hover);
      color: var(--color-text-primary);
      border-color: var(--color-text-disabled);
    }
    .action-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    /* Paginación limpia y plana */
    .pagination-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 12px 16px;
      flex-wrap: wrap;
      border-top: 1px solid var(--color-border);
      background: var(--surface-card);
    }
    .page-btn {
      min-width: 32px;
      height: 32px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--surface-card);
      color: var(--color-text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 0.12s;
    }
    .page-btn:hover:not(:disabled) {
      background: var(--color-hover);
      border-color: var(--color-text-disabled);
    }
    .page-btn.active {
      background: var(--btn-primary-bg);
      color: #ffffff;
      border-color: var(--btn-primary-border);
      font-weight: 600;
    }
    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .page-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }
    .page-info {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-left: 8px;
    }

    /* Responsive: tabla card-style en mobile */
    @media (max-width: 640px) {
      .enterprise-table thead { display: none; }
      .table-row {
        display: block;
        padding: 10px 14px;
        margin: 8px 12px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }
      .table-cell {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border: none;
      }
      .table-cell::before {
        content: attr(data-label);
        font-weight: 500;
        color: var(--color-text-secondary);
        font-size: 0.75rem;
      }
      .actions-cell { justify-content: flex-end; }
    }
  `],
})
export class DataTableComponent implements OnInit, OnChanges, OnDestroy {
  /** Datos a mostrar */
  @Input() data: any[] = [];
  /** Definición de columnas */
  @Input() columns: { key: string; label: string }[] = [];
  /** Tamaño de página */
  @Input() pageSize = 8;
  /** Estado de carga */
  @Input() loading = false;
  /** Acciones disponibles en cada fila */
  @Input() actions: RowAction[] = [];
  /** Etiqueta ARIA para la tabla */
  @Input() ariaLabel = 'Tabla de datos';

  /** Evento emitido al hacer clic en una fila */
  @Output() rowSelected = new EventEmitter<any>();
  /** Evento emitido al ejecutar una acción */
  @Output() actionTriggered = new EventEmitter<{ action: string; row: any }>();

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  searchText = '';
  searchId = `search-${Math.random().toString(36).slice(2)}`;
  filteredData: Record<string, unknown>[] = [];
  currentPage = 0;
  totalPages = 0;
  pagedData: Record<string, unknown>[] = [];
  visiblePages: number[] = [];

  /** Campos de status y priority para badges coloreados */
  private readonly statusFields = new Set(['status']);
  private readonly priorityFields = new Set(['priority']);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term) => {
      this.searchText = term;
      this.currentPage = 0;
      this.applyFilter();
      this.cdr.markForCheck();
    });
    this.applyFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.currentPage = 0;
      this.applyFilter();
    }
  }

  onSearchInput(event: CustomEvent | Event): void {
    const value = (event as CustomEvent).detail?.value ?? (event.target as HTMLInputElement).value ?? '';
    this.searchSubject.next(value);
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowSelected.emit(row);
  }

  onActionClick(event: Event, action: string, row: Record<string, unknown>): void {
    event.stopPropagation();
    this.actionTriggered.emit({ action, row });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.updatePagedData();
    this.cdr.markForCheck();
  }

  getBadgeClass(val: unknown): string {
    return String(val ?? '').toLowerCase();
  }

  getCellType(row: any, key: string): string {
    if (this.statusFields.has(key)) return 'status';
    if (this.priorityFields.has(key)) return 'priority';
    return 'default';
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (value instanceof Date) return value.toLocaleDateString('es-ES');
    if (typeof value === 'object' && (value as { toLocaleDateString?: unknown }).toLocaleDateString) {
      return new Date(value as Date).toLocaleDateString('es-ES');
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  getRowSummary(row: Record<string, unknown>): string {
    return this.columns
      .slice(0, 3)
      .map((c) => this.formatCellValue(row[c.key]))
      .join(' - ');
  }

  private applyFilter(): void {
    const term = this.searchText.toLowerCase().trim();
    if (!term) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter((row) =>
        this.columns.some((col) => {
          const val = this.formatCellValue(row[col.key]);
          return val.toLowerCase().includes(term);
        })
      );
    }
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage >= this.totalPages) this.currentPage = 0;
    this.updatePagedData();
  }

  private updatePagedData(): void {
    const start = this.currentPage * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
    // Páginas visibles (máx 5)
    const half = 2;
    let pStart = Math.max(0, this.currentPage - half);
    let pEnd = Math.min(this.totalPages - 1, this.currentPage + half);
    if (pEnd - pStart < 4) {
      if (pStart === 0) pEnd = Math.min(4, this.totalPages - 1);
      else pStart = Math.max(0, pEnd - 4);
    }
    this.visiblePages = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Registrar iconos necesarios
addIcons({ chevronBackOutline, chevronForwardOutline, searchOutline, createOutline, trashOutline, eyeOutline, funnelOutline });
