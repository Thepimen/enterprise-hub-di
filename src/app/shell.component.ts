/**
 * @file shell.component.ts
 * @description Componente contenedor de rutas protegidas compatible con Signals de AuthService.
 */
import { Component, inject } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonRouterOutlet],
  template: `<ion-router-outlet></ion-router-outlet>`,
})
export class ShellComponent {
  readonly authService = inject(AuthService);
}
