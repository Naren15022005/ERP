import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InventoryService } from './inventory.service';
import { InventoryCacheService } from './inventory-cache.service';

@Component({
  selector: 'app-inventory-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">Inventario</h2>

      <div class="mb-4">
        <div class="flex justify-end">
          <div class="w-64">
            <div class="relative">
              <input
                [(ngModel)]="q"
                (keyup.enter)="search()"
                placeholder="Buscar producto, SKU o ID"
                class="w-full bg-neutral-900/40 border border-neutral-800 rounded-lg py-3 px-3 pr-24 text-sm placeholder-gray-400 text-gray-200"
              />
              <button (click)="search()" aria-label="Buscar" class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 bg-transparent border-0 focus:outline-none">
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35" />
                  <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <div class="mt-2 flex items-center justify-end text-sm text-gray-400">
              <div *ngIf="meta?.total" class="mr-3">Registros: {{ meta.total }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <div *ngIf="loading && !hasCache" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div class="flex flex-col items-center gap-3">
            <svg class="h-12 w-12 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <div class="text-white text-sm">Cargando inventario…</div>
          </div>
        </div>

        <div *ngIf="updating && hasCache" class="absolute right-3 top-3 inline-flex items-center gap-2 text-sm text-gray-300">
          <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>Actualizando…</span>
        </div>

        <div class="overflow-hidden rounded-md border border-neutral-800 bg-transparent">
          <div class="max-h-[60vh] overflow-auto">
            <table class="min-w-full w-full">
              <thead class="z-20">
                <tr class="border-b border-neutral-700">
                  <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">#</th>
                  <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Producto</th>
                  <th class="text-right text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Disponible</th>
                  <th class="text-right text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Reservado</th>
                  <th class="text-right text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Stock Mín</th>
                  <th class="text-center text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-800">
                <tr *ngIf="!stock.length && !loading" class="h-40">
                  <td colspan="6" class="text-center text-gray-400 py-8">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                      </svg>
                      <div class="text-sm">No hay registros para mostrar</div>
                    </div>
                  </td>
                </tr>
                <tr *ngFor="let s of stock; let i = index" (click)="openDetail(s)" role="button" class="cursor-pointer border-b border-neutral-800" [ngClass]="{ 'bg-white/1': (i % 2) === 1, 'hover:bg-white/2': true }">
                  <td class="py-3 px-3 text-sm text-gray-400">{{ getRowNumber(i) }}</td>
                  <td class="py-3 px-3 text-sm text-gray-200 truncate">{{ s.product?.name || s.product_name || '—' }}</td>
                  <td class="py-3 px-3 text-sm text-right text-gray-200">{{ getAvailable(s) }}</td>
                  <td class="py-3 px-3 text-sm text-right text-gray-300">{{ getReserved(s) }}</td>
                  <td class="py-3 px-3 text-sm text-right text-gray-300">{{ s.product?.stock_min ?? '-' }}</td>
                  <td class="py-3 px-3 text-sm text-center">
                    <span [ngClass]="getStatusBadgeClass(s)" class="inline-block px-2 py-1 rounded-full text-xs font-semibold">
                      {{ getStatusLabel(s) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">Página {{ meta.current_page || 1 }} / {{ meta.last_page || 1 }}</div>
        <div class="space-x-2">
          <button class="btn btn-sm" (click)="goto((meta.current_page||1) - 1)" [disabled]="(meta.current_page||1) <= 1">Anterior</button>
          <button class="btn btn-sm" (click)="goto((meta.current_page||1) + 1)" [disabled]="(meta.current_page||1) >= (meta.last_page||1)">Siguiente</button>
        </div>
      </div>

        <!-- Detail drawer -->
        <div *ngIf="selectedStock" class="fixed right-0 top-0 h-full w-96 bg-neutral-900/90 border-l border-neutral-800 p-4 z-40 overflow-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-lg font-semibold">{{ selectedStock.product?.name || selectedStock.product_name }}</div>
              <div class="text-sm text-gray-400">Detalle de inventario</div>
            </div>
            <button (click)="closeDetail()" class="btn btn-ghost btn-sm">Cerrar</button>
          </div>

          <div class="space-y-3 text-sm text-gray-200">
            <div><strong>SKU:</strong> {{ selectedStock.product?.sku || '-' }}</div>
            <div><strong>Código de barras:</strong> {{ selectedStock.product?.barcode || '-' }}</div>
            <div><strong>Precio:</strong> {{ selectedStock.product?.price ? (selectedStock.product.price | number:'1.2-2') : '-' }}</div>
            <div><strong>Almacén:</strong> {{ selectedStock.warehouse?.name || '-' }}</div>
            <div><strong>Cantidad disponible:</strong> {{ getAvailable(selectedStock) }}</div>
            <div><strong>Reservado:</strong> {{ selectedStock.reserved || 0 }}</div>
            <div><strong>Stock mínimo:</strong> {{ selectedStock.product?.stock_min ?? '-' }}</div>
            <div><strong>Última actualización:</strong> {{ selectedStock.updated_at | date:'medium' }}</div>
            <div class="pt-2"><strong>Descripción:</strong>
              <div class="text-xs text-gray-400 mt-1">{{ selectedStock.product?.description || '-' }}</div>
            </div>
          </div>
        </div>
    </div>
  `
})
export class InventoryHomeComponent implements OnInit {
  stock: any[] = [];
  loading = false; // full-screen loader (only when no cache)
  updating = false; // background refresh indicator
  hasCache = false;
  q = '';
  meta: any = { current_page: 1, last_page: 1, total: 0 };
  selectedStock: any = null;

  constructor(private svc: InventoryService, private cache: InventoryCacheService) {}

  ngOnInit(): void {
    // Try synchronous cache-first render
    const cached = this.cache.getCachedSync();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      this.stock = cached;
      this.hasCache = true;
      this.loading = false;
    } else {
      this.loading = true;
    }

    // subscribe to cache updates
    this.cache.cache$.subscribe((data) => {
      if (data && Array.isArray(data)) {
        this.stock = data;
        this.hasCache = true;
      }
      this.loading = false;
      this.updating = false;
    });

    // start background refresh (non-blocking if cache exists)
    this.updating = true;
    this.cache.refresh({ page: 1, per_page: 25 }).subscribe({
      next: (r) => {
        this.meta = r.meta || this.meta;
        this.updating = false;
      },
      error: () => { this.updating = false; this.loading = false; }
    });
  }

  load(params: any = {}) {
    this.updating = true;
    this.cache.refresh(params).subscribe({
      next: (r) => {
        this.meta = r.meta || this.meta;
        this.updating = false;
      },
      error: () => { this.updating = false; }
    });
  }

  search() { this.load({ page: 1, q: this.q }); }
  refresh() { this.load({ page: this.meta.current_page || 1 }); }
  goto(p: number) { if (p < 1) return; this.load({ page: p }); }

  getAvailable(s: any): number {
    const qty = Number(s.quantity || 0);
    const reserved = Number(s.reserved || 0);
    return Math.round((qty - reserved) * 100) / 100;
  }

  getReserved(s: any): number {
    return Math.round((Number(s.reserved || 0)) * 100) / 100;
  }

  getStatusLabel(s: any): string {
    const avail = this.getAvailable(s);
    const min = Number(s.product?.stock_min ?? 0);
    if (avail <= 0) return 'SIN STOCK';
    if (min > 0 && avail <= min) return 'BAJO';
    return 'OK';
  }

  getStatusBadgeClass(s: any): string {
    const label = this.getStatusLabel(s);
    if (label === 'SIN STOCK') return 'bg-red-800 text-red-200';
    if (label === 'BAJO') return 'bg-yellow-800 text-yellow-200';
    return 'bg-green-800 text-green-200';
  }

  openDetail(s: any) {
    this.selectedStock = s;
  }

  closeDetail() { this.selectedStock = null; }

  getRowNumber(i: number): number {
    const page = Number(this.meta?.current_page || 1);
    const per = Number(this.meta?.per_page || this.meta?.perPage || 25);
    return (page - 1) * per + (i + 1);
  }
}
