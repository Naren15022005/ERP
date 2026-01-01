import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-products-low-stock-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">{{ title }}</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (error) {
        <div class="alert alert-error">
          <span class="text-xs">{{ error }}</span>
        </div>
      } @else {
        <div class="text-3xl font-extrabold mt-2" [ngStyle]="{ color: count === 0 ? '#ff2d55' : null }">{{ count }}</div>
        <div class="text-xs text-base-content/60 mt-2">{{ count === 0 ? 'Todo bien' : 'productos con bajo stock' }}</div>
      }
    </div>
  `
})
export class ProductsLowStockWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  title = 'Stock Bajo';
  loading = true;
  error: string | null = null;
  count = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.count = this.initialData.count ?? 0;
      this.loading = false;
    } else {
      this.loadData();
    }
  }

  private loadData() {
    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/products-low-stock`).subscribe({
      next: (data) => {
        this.count = data.count || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos';
        this.loading = false;
        this.count = 0;
      }
    });
  }
}

