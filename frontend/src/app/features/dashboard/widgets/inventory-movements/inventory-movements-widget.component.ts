import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-inventory-movements-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full">
      <h2 class="text-sm text-base-content/70 pr-12">Movimientos Recientes</h2>
      @if (loading) {
        <div class="flex justify-center items-center h-20">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else if (movements.length === 0) {
        <div class="text-xs text-base-content/60">No hay movimientos recientes</div>
      } @else {
        <div class="space-y-2 max-h-32 overflow-y-auto mt-2">
          @for (movement of movements; track movement.id) {
            <div class="flex justify-between text-xs">
              <span>{{ movement.product }}</span>
              <span [class]="movement.type === 'in' ? 'text-success' : 'text-error'">{{ movement.type === 'in' ? '+' : '-' }}{{ movement.quantity }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class InventoryMovementsWidgetComponent implements OnInit {
  @Input() initialData: any = null;
  loading = true;
  movements: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.initialData) {
      this.movements = this.initialData.movements || [];
      this.loading = false;
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/dashboard/widgets/inventory-movements`).subscribe({
      next: (data) => {
        this.movements = data.movements || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.movements = [];
      }
    });
  }
}

