import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'app-theme-preference';

  // Signal reactivo para el estado del tema (oscuro por defecto)
  readonly isDarkMode = signal<boolean>(true);

  constructor() {
    this.initTheme();
  }

  /**
   * Inicializa el tema leyendo localStorage o la preferencia del sistema operativo
   */
  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);

    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      this.isDarkMode.set(isDark);
      this.applyThemeToDOM(isDark);
    } else {
      // Detección automática por media query del sistema
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Preferimos oscuro por defecto si no está explícito
      const initialDark = prefersDark !== false;
      this.isDarkMode.set(initialDark);
      this.applyThemeToDOM(initialDark);
    }
  }

  /**
   * Alterna entre modo oscuro y claro
   */
  toggleTheme(): void {
    const nextState = !this.isDarkMode();
    this.isDarkMode.set(nextState);
    localStorage.setItem(this.THEME_STORAGE_KEY, nextState ? 'dark' : 'light');
    this.applyThemeToDOM(nextState);
  }

  /**
   * Aplica las clases de Ionic y personalizadas al elemento raíz y al body
   */
  private applyThemeToDOM(isDark: boolean): void {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('ion-palette-dark', 'dark');
      root.classList.remove('light');
      body.classList.add('ion-palette-dark', 'dark');
      body.classList.remove('light');
    } else {
      root.classList.remove('ion-palette-dark', 'dark');
      root.classList.add('light');
      body.classList.remove('ion-palette-dark', 'dark');
      body.classList.add('light');
    }
  }
}
