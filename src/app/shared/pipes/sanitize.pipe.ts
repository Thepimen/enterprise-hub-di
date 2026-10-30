/**
 * @file sanitize.pipe.ts
 * @description Pipe standalone para sanitización segura de contenido dinámico mediante DomSanitizer.
 * Protege contra vulnerabilidades XSS (Cross-Site Scripting, CWE-79) al renderizar contenido de usuarios.
 */
import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeQueryInput } from '../../core/utils/security.util';

@Pipe({
  name: 'safeSanitize',
  standalone: true,
})
export class SafeSanitizePipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Sanitiza y limpia el texto antes de ser proyectado en el DOM.
   * @param value Texto o HTML recibido del usuario
   * @returns SafeHtml sanitizado
   */
  transform(value: string | null | undefined): SafeHtml | string {
    if (!value) return '';
    const clean = sanitizeQueryInput(value);
    const sanitizedHtml = this.sanitizer.sanitize(SecurityContext.HTML, clean) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
  }
}
