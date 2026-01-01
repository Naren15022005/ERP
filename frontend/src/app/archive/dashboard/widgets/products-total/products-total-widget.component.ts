import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-products-total-widget',
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
        <div class="text-3xl font-extrabold text-sky-400 mt-2">{{ total }}</div>
        <div class="text-xs text-base-content/60 mt-2">{{ active }} activos</div>
      }
    </div>
  `
})
export class ProductsTotalWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  title = 'Total de Productos';
  loading = true;
  error: string | null = null;
  total = 0;
  active = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.total = this.initialData.total ?? 0;
      this.active = this.initialData.active ?? this.initialData.total ?? 0;
      this.loading = false;
    } else {
      this.loadData();
    }
  }

  private loadData() {
    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/products-total`).subscribe({
      next: (data) => {
        this.total = data.total || 0;
        this.active = data.active || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos';
        this.loading = false;
        this.total = 0;
        this.active = 0;
      }
    });
  }
}
