import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">Productos</h2>
      <p>Listado de productos (mock). En el futuro se consumirá: <code>/api/products</code></p>
      <ul class="mt-4 space-y-2">
        <li *ngFor="let p of products" class="p-3 bg-white shadow rounded">
          <div class="font-semibold">{{p.name}}</div>
          <div class="text-sm text-gray-600">SKU: {{p.sku}} — Precio: {{p.price | currency}}</div>
        </li>
      </ul>
    </div>
  `
})
export class ProductsListComponent {
  products = [
    { id: 1, sku: 'P-001', name: 'Producto A', price: 12.5 },
    { id: 2, sku: 'P-002', name: 'Producto B', price: 8.99 },
    { id: 3, sku: 'P-003', name: 'Producto C', price: 5.0 }
  ];
}
