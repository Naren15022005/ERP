import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-customers-top-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Top Clientes</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (customers.length === 0) {
        <div class="text-xs text-base-content/60">No hay datos disponibles</div>
      } @else {
        <div class="space-y-2 mt-2">
          @for (customer of customers; track customer.id) {
            <div class="flex justify-between text-sm">
              <span>{{ customer.name }}</span>
              <span class="font-bold">{{ customer.total | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CustomersTopWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  customers: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.customers = this.initialData.customers || [];
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/customers-top`).subscribe({
      next: (data) => {
        this.customers = data.customers || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.customers = [];
      }
    });
  }
}

