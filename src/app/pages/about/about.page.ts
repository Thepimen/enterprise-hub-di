import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonChip,
  IonLabel,
} from '@ionic/angular/standalone';

interface CompetencyItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface MetricItem {
  value: string;
  label: string;
  caption: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonLabel,
  ],
})
export class AboutPage {
  public readonly themeService = inject(ThemeService);
  readonly githubProfileUrl = 'https://github.com/thepimen';

  readonly competencies: CompetencyItem[] = [
    {
      title: 'Angular Standalone & Modern Control Flow',
      description: 'Arquitecturas limpias y desacopladas sin módulos heredados (AppModule), empleando @if, @for con track e inyección funcional con inject().',
      icon: 'code-slash-outline',
      color: '#EA4335',
    },
    {
      title: 'Ionic Multiplataforma & Web SPA',
      description: 'Interfaces adaptables optimizadas tanto para escritorio como para dispositivos móviles con componentes Web Component nativos de alto rendimiento.',
      icon: 'layers-outline',
      color: '#3880FF',
    },
    {
      title: 'Integración de Cloud APIs & Resiliencia',
      description: 'Consumo eficiente de servicios REST públicos (Google Books API) con arquitecturas tolerantes a fallos y contingencia automática (HTTP 429).',
      icon: 'globe-outline',
      color: '#34A853',
    },
    {
      title: 'Sistemas de Gestión & Stock Valorado',
      description: 'Cálculo algorítmico y visualización contable en tiempo real de inventarios, descuentos acumulados y métricas comerciales.',
      icon: 'cash-outline',
      color: '#FBBC04',
    },
  ];

  readonly metrics: MetricItem[] = [
    { value: '100%', label: 'Standalone', caption: 'Sin AppModule en todo el codebase' },
    { value: 'DAM2', label: 'Especialización', caption: 'Desarrollo de Interfaces Multiplataforma' },
    { value: 'REST API', label: 'Conectividad Cloud', caption: 'Integración directa con Google Books' },
    { value: '0 Error', label: 'Compilación', caption: 'Build estricto y tipado integral' },
  ];
}
