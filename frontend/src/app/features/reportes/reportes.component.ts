import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-reportes',
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">Reportes</h3>
      <p class="text-sm text-muted">Aquí podrás ver y descargar reportes del sistema (placeholder).</p>
      <!-- TODO: implementar vistas y descargas de reportes -->
    </div>
  `
})
export class ReportesComponent {}
