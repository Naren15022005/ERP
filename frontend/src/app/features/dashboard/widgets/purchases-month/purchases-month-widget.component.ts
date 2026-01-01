import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-purchases-month-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Compras del Mes</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else {
        <div class="text-3xl font-extrabold text-primary mt-2">{{ total | currency:'USD':'symbol':'1.0-0' }}</div>
        <div class="text-xs text-base-content/60 mt-2">{{ count }} órdenes de compra</div>
      }
    </div>
  `
})
export class PurchasesMonthWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  total = 0;
  count = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.total = this.initialData.total ?? 0;
      this.count = this.initialData.count ?? 0;
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/purchases-month`).subscribe({
      next: (data) => {
        this.total = data.total || 0;
        this.count = data.count || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.total = 0;
        this.count = 0;
      }
    });
  }
}

