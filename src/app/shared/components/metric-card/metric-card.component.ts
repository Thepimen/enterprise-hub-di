/**
 * @file metric-card.component.ts
 * @description Widget KPI tipográfico agnóstico y reutilizable para el Dashboard.
 * Sigue las directrices anti-slop de Taste Skill:
 * - Sin iconos en cajas redondeadas de colores ("tells.md")
 * - Sin degradados superiores ni sombras pesadas ("app-screens.md §5")
 * - Enfoque tipográfico con números tabulares y deltas honestas
 * Implementa ChangeDetectionStrategy.OnPush y accesibilidad semántica.
 */
import {
  Component, Input, ChangeDetectionStrategy, OnInit, OnChanges, OnDestroy, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trendingUpOutline, trendingDownOutline, removeOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  statsChartOutline, timerOutline, hardwareChipOutline,
  cloudUploadOutline, shieldCheckmarkOutline, peopleOutline
} from 'ionicons/icons';

addIcons({
  trendingUpOutline, trendingDownOutline, removeOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  statsChartOutline, timerOutline, hardwareChipOutline,
  cloudUploadOutline, shieldCheckmarkOutline, peopleOutline
});

@Component({
  selector: 'app-metric-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonIcon],
  template: `
    <article
      class="metric-card"
      [class]="'metric-card--' + status"
      role="region"
      [attr.aria-label]="ariaDescription"
    >
      <div class="metric-card__header">
        <span class="metric-card__title">{{ title }}</span>
        <span class="metric-card__dot" [class]="'dot--' + status" aria-hidden="true"></span>
      </div>

      <div class="metric-card__body">
        <p class="metric-card__value" [attr.aria-label]="title + ': ' + value + (unit ? ' ' + unit : '')">
          {{ value }}
          <span *ngIf="unit" class="metric-card__unit">{{ unit }}</span>
        </p>
      </div>

      <div class="metric-card__footer">
        <span class="trend-badge" [class]="'trend--' + trendDirection" [attr.aria-label]="trendLabel">
          <ion-icon [name]="trendIcon" class="trend-icon" aria-hidden="true"></ion-icon>
          <span class="trend-number">{{ trend > 0 ? '+' : '' }}{{ trend }}%</span>
        </span>
        <span class="trend-context">vs periodo ant.</span>
      </div>
    </article>
  `,
  styles: [`
    .metric-card {
      background: var(--surface-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 116px;
      position: relative;
      transition: border-color 0.15s ease;
    }
    .metric-card:hover {
      border-color: var(--color-text-disabled);
    }
    .metric-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .metric-card__title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      letter-spacing: -0.01em;
      margin: 0;
    }
    .metric-card__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot--success { background: #059669; }
    .dot--warning { background: #d97706; }
    .dot--danger  { background: #dc2626; }

    .metric-card__body {
      margin: 8px 0 6px;
    }
    .metric-card__value {
      font-size: 1.65rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    .metric-card__unit {
      font-size: 0.95rem;
      font-weight: 400;
      color: var(--color-text-secondary);
      margin-left: 2px;
    }

    .metric-card__footer {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .trend-icon {
      font-size: 0.85rem;
    }
    .trend--up    { color: #059669; }
    .trend--down  { color: #dc2626; }
    .trend--stable { color: var(--color-text-secondary); }
    .trend-number { font-weight: 600; }
    .trend-context {
      color: var(--color-text-disabled);
      font-size: 0.72rem;
    }
  `],
})
export class MetricCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() icon = 'stats-chart-outline';
  @Input() trend = 0;
  @Input() status: 'success' | 'warning' | 'danger' = 'success';
  @Input() unit = '';

  private readonly destroy$ = new Subject<void>();

  trendIcon = 'remove-outline';
  trendDirection: 'up' | 'down' | 'stable' = 'stable';
  trendLabel = '';
  ariaDescription = '';

  ngOnInit(): void {
    this.updateDerived();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateDerived();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDerived(): void {
    if (this.trend > 0) {
      this.trendIcon = 'trending-up-outline';
      this.trendDirection = 'up';
      this.trendLabel = `Tendencia al alza: +${this.trend}%`;
    } else if (this.trend < 0) {
      this.trendIcon = 'trending-down-outline';
      this.trendDirection = 'down';
      this.trendLabel = `Tendencia a la baja: ${this.trend}%`;
    } else {
      this.trendIcon = 'remove-outline';
      this.trendDirection = 'stable';
      this.trendLabel = 'Tendencia estable';
    }

    this.ariaDescription = `${this.title}: ${this.value}${this.unit ? ' ' + this.unit : ''}. ${this.trendLabel}. Estado: ${this.status === 'success' ? 'correcto' : this.status === 'warning' ? 'advertencia' : 'crítico'}.`;
  }
}
