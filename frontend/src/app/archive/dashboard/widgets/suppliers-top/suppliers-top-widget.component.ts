import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-suppliers-top-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Top Proveedores</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (suppliers.length === 0) {
        <div class="text-xs text-base-content/60">No hay datos disponibles</div>
      } @else {
        <div class="space-y-2">
          @for (supplier of suppliers; track supplier.id) {
            <div class="flex justify-between text-sm">
              <span>{{ supplier.name }}</span>
              <span class="font-bold">{{ supplier.total | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SuppliersTopWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  suppliers: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.suppliers = this.initialData.suppliers || [];
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/suppliers-top`).subscribe({
      next: (data) => {
        this.suppliers = data.suppliers || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.suppliers = [];
      }
    });
  }
}
