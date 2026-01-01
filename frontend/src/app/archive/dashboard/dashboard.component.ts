import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../core/services/auth.service';
import { DashboardService, DashboardWidget } from '../core/services/dashboard.service';
import { DashboardGridComponent } from './dashboard-grid/dashboard-grid.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardGridComponent],
  template: `
    <div class="p-6">
      <div class="mb-6">
        @if (currentUser) {
          <p class="text-gray-600 mt-2">Bienvenido, {{ currentUser.name }}</p>
          @if (currentUser.tenant) {
            <p class="text-sm text-gray-500">{{ currentUser.tenant.name }}</p>
          }
        }
      </div>

      <!-- Dynamic Widgets Grid -->
      @if (widgets$ | async; as widgets) {
        @if (widgets.length > 0) {
          <app-dashboard-grid [widgets]="widgets"></app-dashboard-grid>
        } @else {
          <div class="alert alert-info">
            <span>No hay widgets configurados para tu plan actual.</span>
          </div>
        }
      } @else {
        <div class="flex justify-center items-center h-64">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      }

      <!-- Quick Actions -->
      <div class="card bg-base-100 shadow-xl mt-8 rounded-[8px] bg-card">
        <div class="card-body">
          <h2 class="card-title">Acciones Rápidas</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <button class="btn btn-outline btn-primary inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap min-w-0 min-h-[36px]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Venta
            </button>
            <button class="btn btn-outline btn-secondary inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap min-w-0 min-h-[36px]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Producto
            </button>
            @if (!isSingleUser) {
            <button class="btn btn-outline btn-accent">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Nuevo Usuario
            </button>
            }
            <button class="btn btn-outline">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Reportes
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  
  currentUser: User | null = null;
  isSingleUser = false;
  widgets$!: Observable<DashboardWidget[]>;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isSingleUser = !!(user?.tenant?.config && user?.tenant?.config.employees_count === 1);
    });
    
    // Load widgets from backend
    this.widgets$ = this.dashboardService.getWidgets();
  }
}
