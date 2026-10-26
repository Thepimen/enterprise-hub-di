/**
 * @file metric-card.component.ts
 * @description Widget KPI agnóstico y reutilizable para el Dashboard.
 * Implementa ChangeDetectionStrategy.OnPush y accesibilidad semántica.
 * @input title, value, icon, trend, status
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
      <div class="metric-card__icon-wrapper" [class]="'icon-wrapper--' + status" aria-hidden="true">
        <ion-icon [name]="icon" class="metric-card__icon"></ion-icon>
      </div>

      <div class="metric-card__content">
        <p class="metric-card__title">{{ title }}</p>
        <p class="metric-card__value" [attr.aria-label]="title + ': ' + value + (unit ? ' ' + unit : '')">
          {{ value }}
          <span *ngIf="unit" class="metric-card__unit">{{ unit }}</span>
        </p>
      </div>

      <div class="metric-card__trend" [attr.aria-label]="trendLabel">
        <ion-icon
          [name]="trendIcon"
          class="trend-icon"
          [class]="'trend-icon--' + trendDirection"
          aria-hidden="true"
        ></ion-icon>
        <span class="trend-value" [class]="'trend-value--' + trendDirection">
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </span>
      </div>

      <!-- Indicador de estado accesible -->
      <span class="status-dot" [class]="'status-dot--' + status" [attr.aria-hidden]="true"></span>
    </article>
  `,
  styles: [`
    .metric-card {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 20px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto;
      gap: 8px 14px;
      align-items: center;
      border: 1px solid var(--color-border);
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }
    .metric-card--success::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .metric-card--warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .metric-card--danger::before  { background: linear-gradient(90deg, #ef4444, #f87171); }

    .metric-card__icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      grid-row: 1 / 3;
    }
    .icon-wrapper--success { background: rgba(16, 185, 129, 0.12); }
    .icon-wrapper--warning { background: rgba(245, 158, 11, 0.12); }
    .icon-wrapper--danger  { background: rgba(239, 68, 68, 0.12); }

    .metric-card__icon {
      font-size: 1.6rem;
    }
    .icon-wrapper--success .metric-card__icon { color: #10b981; }
    .icon-wrapper--warning .metric-card__icon { color: #f59e0b; }
    .icon-wrapper--danger  .metric-card__icon { color: #ef4444; }

    .metric-card__content { grid-column: 2; }
    .metric-card__title {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.1;
    }
    .metric-card__unit {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    .metric-card__trend {
      grid-column: 3;
      grid-row: 1 / 3;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .trend-icon { font-size: 1.3rem; }
    .trend-icon--up    { color: #10b981; }
    .trend-icon--down  { color: #ef4444; }
    .trend-icon--stable { color: #6b7280; }
    .trend-value { font-size: 0.78rem; font-weight: 600; }
    .trend-value--up    { color: #10b981; }
    .trend-value--down  { color: #ef4444; }
    .trend-value--stable { color: #6b7280; }

    .status-dot {
      position: absolute;
      top: 12px; right: 12px;
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .status-dot--success { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
    .status-dot--warning { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
    .status-dot--danger  { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.2);  }
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

addIcons({
  trendingUpOutline, trendingDownOutline, removeOutline,
  serverOutline, alertCircleOutline, checkmarkCircleOutline,
  statsChartOutline, timerOutline, hardwareChipOutline,
  cloudUploadOutline, shieldCheckmarkOutline, peopleOutline
});
