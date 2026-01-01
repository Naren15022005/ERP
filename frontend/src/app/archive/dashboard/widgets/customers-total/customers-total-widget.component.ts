import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-customers-total-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Total de Clientes</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else {
        <div class="text-3xl font-extrabold text-success mt-2">{{ total }}</div>
        <div class="text-xs text-base-content/60 mt-2">{{ active }} activos</div>
      }
    </div>
  `
})
export class CustomersTotalWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  total = 0;
  active = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.total = this.initialData.total ?? 0;
      this.active = this.initialData.active ?? 0;
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/customers-total`).subscribe({
      next: (data) => {
        this.total = data.total || 0;
        this.active = data.active || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.total = 0;
        this.active = 0;
      }
    });
  }
}
