import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonChip,
  IonLabel,
} from '@ionic/angular/standalone';

import { ThemeService } from '../../services/theme.service';

interface TechFeature {
  title: string;
  badge: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
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
export class InicioPage {
  private readonly router = inject(Router);
  public readonly themeService = inject(ThemeService);

  readonly techFeatures: TechFeature[] = [
    {
      title: 'Angular Standalone & Control Flow',
      badge: 'Angular Core',
      description: 'Arquitectura moderna sin módulos (app.module), aprovechando la nueva sintaxis @if y @for con track.',
      icon: 'code-slash-outline',
      color: '#EA4335',
    },
    {
      title: 'Componentes Ionic Standalone',
      badge: 'Ionic UI',
      description: 'Importación granular desde @ionic/angular/standalone para optimización máxima de bundle y renderizado.',
      icon: 'layers-outline',
      color: '#3880FF',
    },
    {
      title: 'Google Books REST API',
      badge: 'REST Service',
      description: 'Integración reactiva consumiendo volúmenes con RxJS, tipado estricto y manejo defensivo de errores.',
      icon: 'library-outline',
      color: '#34A853',
    },
    {
      title: 'Despliegue SPA & Vercel',
      badge: 'Cloud Ready',
      description: 'Configuración con rewrites en vercel.json para routing SPA sin pérdidas de estado en recargas directas.',
      icon: 'globe-outline',
      color: '#FBBC05',
    },
  ];

  navegarACatalogo(): void {
    this.router.navigate(['/libros']);
  }
}
