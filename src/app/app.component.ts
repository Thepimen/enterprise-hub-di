/**
 * @file app.component.ts
 * @description Componente raíz de la aplicación. Renderiza ion-app y el router outlet.
 * El layout de navegación se gestiona en ShellComponent para las rutas protegidas.
 */
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {}
