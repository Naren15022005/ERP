import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '../../core/services/sales.service';
import { VentasFormComponent } from './ventas-form/ventas-form.component';
import { VentasDetailsComponent } from './ventas-details/ventas-details.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, VentasFormComponent, VentasDetailsComponent],
  template: `
    <div class="p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Ventas</h2>
        <div>
          <button class="btn btn-sm btn-primary" (click)="create()">Nueva venta</button>
        </div>
      </div>

      <div class="mt-4">
        <div *ngIf="loading" class="text-sm text-gray-500">Cargando ventas...</div>
        <div *ngIf="error" class="text-sm text-red-500">{{ error }}</div>

        <table class="table w-full mt-2">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th class="text-right">Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="!loading && sales?.length === 0">
              <td colspan="6" class="text-center text-sm text-gray-500">No hay ventas registradas.</td>
            </tr>
            <tr *ngIf="!loading && error">
              <td colspan="6" class="text-center text-sm text-red-500">Error cargando ventas. Revisa la consola para más detalles.</td>
            </tr>
            <tr *ngFor="let s of sales">
              <td>{{ s.id }}</td>
              <td>{{ s.created_at | date:'short' }}</td>
              <td>{{ s.customer_name || s.customer?.name || '-' }}</td>
              <td class="text-right">{{ s.total | currency }}</td>
              <td>{{ s.status }}</td>
              <td>
                <button class="btn btn-ghost btn-sm" (click)="details(s)">Ver</button>
                <button class="btn btn-ghost btn-sm" (click)="edit(s)">Editar</button>
                <button class="btn btn-ghost btn-sm btn-error" (click)="remove(s)">Borrar</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="showForm" class="mt-4">
          <app-ventas-form [sale]="editing" (saved)="onSaved($event)" (cancel)="onCancel()"></app-ventas-form>
        </div>

        <div *ngIf="showDetails" class="mt-4">
          <app-ventas-details [sale]="showDetails"></app-ventas-details>
        </div>

        <div *ngIf="!loading && (!sales || sales.length === 0)" class="text-sm text-gray-500 mt-2">No hay ventas registradas.</div>
      </div>
    </div>
  `
})
export class VentasComponent implements OnInit {
  sales: any[] = [];
  loading = false;
  error: string | null = null;

  private salesService = inject(SalesService);
  showForm = false;
  editing: any | null = null;
  showDetails: any | null = null;

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.salesService.list().subscribe({
      next: (res) => {
        this.sales = Array.isArray(res) ? res : (res?.data || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        this.error = err?.message ? `Error: ${err.message}` : 'Error cargando ventas';
        this.loading = false;
      }
    });
  }

  create() {
    this.editing = null;
    this.showForm = true;
  }

  edit(sale: any) {
    this.editing = sale;
    this.showForm = true;
  }

  remove(sale: any) {
    if (!confirm(`¿Borrar venta #${sale.id}?`)) return;
    this.salesService.delete(sale.id).subscribe({
      next: () => {
        this.sales = this.sales.filter(s => s.id !== sale.id);
      },
      error: () => alert('Error al borrar la venta')
    });
  }

  onSaved(payload: any) {
    const isUpdate = !!payload?.id;
    this.showForm = false;
    if (isUpdate) {
      this.salesService.update(payload.id, payload).subscribe({ next: () => this.load(), error: () => alert('Error al actualizar') });
    } else {
      this.salesService.create(payload).subscribe({ next: () => this.load(), error: () => alert('Error al crear') });
    }
  }

  onCancel() {
    this.showForm = false;
  }

  details(sale: any) {
    this.showDetails = sale;
  }
}
