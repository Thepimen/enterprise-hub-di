/**
 * @file notification.service.ts
 * @description Servicio centralizado de notificaciones accesibles mediante Ionic Toasts.
 * Implementa ARIA live regions para lectores de pantalla.
 */
import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type ToastType = 'success' | 'warning' | 'danger' | 'primary';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastCtrl = inject(ToastController);

  /**
   * Muestra un toast de éxito.
   * @param message - Mensaje a mostrar
   * @param duration - Duración en ms (por defecto 3000)
   */
  async success(message: string, duration = 3000): Promise<void> {
    await this.showToast(message, 'success', duration, 'checkmark-circle-outline');
  }

  /**
   * Muestra un toast de error/danger.
   */
  async error(message: string, duration = 4000): Promise<void> {
    await this.showToast(message, 'danger', duration, 'alert-circle-outline');
  }

  /**
   * Muestra un toast de advertencia.
   */
  async warning(message: string, duration = 3500): Promise<void> {
    await this.showToast(message, 'warning', duration, 'warning-outline');
  }

  /**
   * Muestra un toast informativo.
   */
  async info(message: string, duration = 3000): Promise<void> {
    await this.showToast(message, 'primary', duration, 'information-circle-outline');
  }

  /**
   * Método base para crear y presentar toasts accesibles.
   * Incluye role="status" para lectores de pantalla.
   */
  private async showToast(
    message: string,
    color: ToastType,
    duration: number,
    icon: string
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color,
      icon,
      position: 'top',
      cssClass: ['enterprise-toast', `toast-${color}`],
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
          side: 'end',
        },
      ],
      // Accesibilidad: aria para lectores de pantalla
      htmlAttributes: {
        role: 'status',
        'aria-live': color === 'danger' ? 'assertive' : 'polite',
        'aria-atomic': 'true',
      },
    });
    await toast.present();
  }
}
