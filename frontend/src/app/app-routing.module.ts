import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.component').then(m => m.CajaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'egresos',
    loadComponent: () => import('./features/egresos/egresos.component').then(m => m.EgresosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ingresos',
    loadComponent: () => import('./features/ingresos/ingresos.component').then(m => m.IngresosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ventas',
    loadComponent: () => import('./features/ventas/ventas.component').then(m => m.VentasComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'users', 
    loadComponent: () => import('./features/users/users-list.component').then(m => m.UsersListComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permissions: ['users.view', 'manage users'] }
  },
  { 
    path: 'products', 
    loadComponent: () => import('./features/products/products-list.component').then(m => m.ProductsListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/inventory-home.component').then(m => m.InventoryHomeComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      { path: 'products', loadComponent: () => import('./features/inventory/products-list.component').then(m => m.InventoryProductsComponent) },
      { path: 'categories', loadComponent: () => import('./features/inventory/categories-list.component').then(m => m.InventoryCategoriesComponent) },
      { path: 'kardex', loadComponent: () => import('./features/inventory/kardex-list.component').then(m => m.InventoryKardexComponent) }
    ]
  },
  {
    path: 'alerts',
    loadComponent: () => import('./features/alerts/alerts-list.component').then(m => m.AlertsListComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) 
  },
  {
    path: 'settings/modules',
    loadComponent: () => import('./features/settings/tenant-modules.component').then(m => m.TenantModulesSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/auth/forbidden.component').then(m => m.ForbiddenComponent)
  },
  // fallback
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
