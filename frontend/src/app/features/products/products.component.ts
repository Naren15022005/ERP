import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-lg font-semibold">Productos</h2>
      <p class="text-sm text-gray-400">Vista placeholder creada automáticamente.</p>
    </div>
  `
})
export class ProductsComponent {}
