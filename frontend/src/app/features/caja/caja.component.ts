import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyCloseService } from '../../core/services/daily-close.service';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-lg font-semibold">Caja Diaria</h2>

      <div class="tabs mt-4">
        <a
          class="tab tab-lifted"
          [class.tab-active]="activeTab === 'pos'"
          (click)="activeTab='pos'"
          [style.transition]="'text-shadow 180ms ease, box-shadow 180ms ease'"
          [style.textShadow]="activeTab === 'pos' ? '0 0 10px rgba(99,102,241,0.55)' : 'none'"
        >
          POS
        </a>
        <a
          class="tab tab-lifted"
          [class.tab-active]="activeTab === 'cierre'"
          (click)="activeTab='cierre'"
          [style.transition]="'text-shadow 180ms ease, box-shadow 180ms ease'"
          [style.textShadow]="activeTab === 'cierre' ? '0 0 10px rgba(139,92,246,0.55)' : 'none'"
        >
          Cierre del día
        </a>
      </div>

      <div class="mt-6">
        <ng-container *ngIf="activeTab === 'pos'">
          <div class="p-4 border rounded bg-base-100">
            <h3 class="font-medium mb-2">POS</h3>
            <p class="text-sm text-gray-500">Interfaz POS (placeholder). Aquí irá la caja/TPV.</p>
          </div>
        </ng-container>

        <ng-container *ngIf="activeTab === 'cierre'">
          <div class="p-4 border rounded bg-base-100">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Cierres diarios</h3>
              <div>
                <button class="btn btn-sm btn-primary" (click)="createClose()">Generar cierre (hoy)</button>
              </div>
            </div>

            <div class="mt-4">
              <div *ngIf="loading" class="text-sm text-gray-500">Cargando cierres…</div>
              <div *ngIf="error" class="text-sm text-red-500">{{ error }}</div>

              <table class="table w-full mt-2">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Efectivo</th>
                    <th class="text-right">Tarjeta</th>
                    <th class="text-right">Transacciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="!loading && closes?.length === 0">
                    <td colspan="7" class="text-center text-sm text-gray-500">No hay cierres registrados.</td>
                  </tr>
                  <tr *ngFor="let c of closes">
                    <td>{{ c.id }}</td>
                    <td>{{ c.date | date:'shortDate' }}</td>
                    <td class="text-right">{{ c.total_sales | currency }}</td>
                    <td class="text-right">{{ c.cash_total | currency }}</td>
                    <td class="text-right">{{ c.card_total | currency }}</td>
                    <td class="text-right">{{ c.transactions_count }}</td>
                    <td>
                      <button class="btn btn-xs btn-ghost" (click)="view(c)">Ver</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class CajaComponent implements OnInit {
  activeTab: 'pos' | 'cierre' = 'pos';
  private dailyCloseService = inject(DailyCloseService);

  closes: any[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    // default to POS; if you want to open cierre by default, set activeTab
    this.loadIfNeeded();
  }

  loadIfNeeded() {
    if (this.activeTab === 'cierre') this.loadCloses();
  }

  loadCloses() {
    this.loading = true;
    this.error = null;
    this.dailyCloseService.list().subscribe({ next: (res) => { this.closes = res?.data || res || []; this.loading = false; }, error: (err) => { console.error(err); this.error = err?.message || 'Error cargando cierres'; this.loading = false; } });
  }

  createClose() {
    if (!confirm('Generar cierre del día actual?')) return;
    this.dailyCloseService.create({}).subscribe({ next: (res) => { this.loadCloses(); }, error: (err) => { alert('Error creando cierre'); console.error(err); } });
  }

  view(c: any) {
    alert('Ver cierre #' + c.id + ' (implementa modal/detalle)');
  }
}
