import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sale } from '../../../core/models/sales';

@Component({
  selector: 'app-ventas-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 border rounded bg-base-100">
      <h3 class="text-md font-semibold mb-2">Detalle venta #{{ sale?.id }}</h3>
      <div class="text-sm">Cliente: {{ sale?.customer_name || '-' }}</div>
      <div class="text-sm">Fecha: {{ sale?.created_at | date:'short' }}</div>
      <div class="text-sm">Estado: {{ sale?.status }}</div>

      <div class="mt-3">
        <h4 class="font-medium">Items</h4>
        <table class="table w-full mt-2">
          <thead><tr><th>Producto</th><th class="text-right">Cantidad</th><th class="text-right">Precio</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            <tr *ngFor="let it of sale?.items || []">
              <td>{{ it.product_name }}</td>
              <td class="text-right">{{ it.quantity }}</td>
              <td class="text-right">{{ it.price | currency }}</td>
              <td class="text-right">{{ it.total | currency }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 text-right">Total: <strong>{{ sale?.total | currency }}</strong></div>
    </div>
  `
})
export class VentasDetailsComponent {
  @Input() sale: Sale | null = null;
}
