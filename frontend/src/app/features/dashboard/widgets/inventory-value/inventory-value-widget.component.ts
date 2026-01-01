import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-inventory-value-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Valor del Inventario</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else {
        <div class="text-3xl font-extrabold text-accent mt-2">{{ total | currency:'USD':'symbol':'1.0-0' }}</div>
        <div class="text-xs text-base-content/60 mt-2">{{ units }} unidades en stock</div>
      }
    </div>
  `
})
export class InventoryValueWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  total = 0;
  units = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.total = this.initialData.total ?? 0;
      this.units = this.initialData.units ?? 0;
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/inventory-value`).subscribe({
      next: (data) => {
        this.total = data.total || 0;
        this.units = data.units || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.total = 0;
        this.units = 0;
      }
    });
  }
}

