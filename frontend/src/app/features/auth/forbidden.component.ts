import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-xl mx-auto mt-12">
      <div class="bg-white shadow rounded p-6 text-center">
        <h1 class="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p class="text-sm text-gray-600 mb-4">No tienes permisos para ver esta página.</p>
        <a class="btn btn-primary" href="/">Ir al inicio</a>
      </div>
    </div>
  `
})
export class ForbiddenComponent {}
