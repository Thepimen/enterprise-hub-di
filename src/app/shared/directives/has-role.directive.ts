/**
 * @file has-role.directive.ts
 * @description Directiva estructural standalone (*hasRole="['ADMIN']") para renderizado condicional según privilegios RBAC.
 * Remueve físicamente elementos sensibles del DOM si el rol activo del usuario no satisface los requisitos.
 */
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SystemRole } from '../../core/models/auth.model';

@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: string[] = [];
  private isViewCreated = false;

  constructor() {
    // Escucha reactiva mediante effect() sobre las señales de AuthService
    effect(() => {
      const user = this.authService.currentUser();
      const currentRole = (user?.role ?? '').toUpperCase();
      this.evaluatePermission(currentRole);
    });
  }

  @Input()
  set hasRole(roles: SystemRole[] | SystemRole | string[] | string) {
    if (Array.isArray(roles)) {
      this.allowedRoles = roles.map((r) => String(r).toUpperCase());
    } else if (roles) {
      this.allowedRoles = [String(roles).toUpperCase()];
    } else {
      this.allowedRoles = [];
    }
    const currentRole = (this.authService.currentUser()?.role ?? '').toUpperCase();
    this.evaluatePermission(currentRole);
  }

  private evaluatePermission(currentRole: string): void {
    const isAuthorized = this.allowedRoles.includes(currentRole);

    if (isAuthorized && !this.isViewCreated) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isViewCreated = true;
    } else if (!isAuthorized && this.isViewCreated) {
      this.viewContainer.clear();
      this.isViewCreated = false;
    }
  }
}
