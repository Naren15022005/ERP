import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-purchases-pending-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Compras Pendientes</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else {
        <div class="text-3xl font-extrabold mt-2" [class.text-warning]="count > 0">{{ count }}</div>
        <div class="text-xs text-base-content/60 mt-2">órdenes por recibir</div>
      }
    </div>
  `
})
export class PurchasesPendingWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  count = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.count = this.initialData.count ?? 0;
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/purchases-pending`).subscribe({
      next: (data) => {
        this.count = data.count || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.count = 0;
      }
    });
  }
}
