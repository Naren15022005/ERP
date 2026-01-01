import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated first
  if (!authService.isAuthenticated) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get required permissions from route data
  const requiredPermissions = route.data['permissions'] as string[];
  const requiredRoles = route.data['roles'] as string[];

  // If no permissions/roles required, allow access
  if (!requiredPermissions?.length && !requiredRoles?.length) {
    return true;
  }

  // Check permissions
  if (requiredPermissions?.length) {
    const hasPermission = authService.hasAnyPermission(requiredPermissions);
    if (hasPermission) {
      return true;
    }

    // Fallback: if the tenant selected the corresponding module (e.g. 'products'
    // for permission 'products.view'), allow access even if explicit
    // permission strings are not present on the user object. This lets
    // users who chose the module at registration use it while backend
    // permission sync is fixed.
    const tenantModules: string[] = (authService.currentUserValue as any)?.tenant?.config?.modules || [];

    const allowedByModule = Array.isArray(tenantModules) && tenantModules.length > 0 && requiredPermissions.some(p => {
      const moduleKey = p.includes('.') ? p.split('.')[0] : (p.split(' ').pop() ?? '');
      return moduleKey && tenantModules.includes(moduleKey);
    });

    if (allowedByModule) {
      return true;
    }

    router.navigate(['/forbidden']);
    return false;
  }

  // Check roles
  if (requiredRoles?.length) {
    const hasRole = authService.hasAnyRole(requiredRoles);
    if (!hasRole) {
      router.navigate(['/forbidden']);
      return false;
    }
  }

  return true;
};
