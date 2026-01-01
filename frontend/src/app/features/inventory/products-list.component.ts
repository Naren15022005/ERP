import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InventoryService } from './inventory.service';
import { InventoryCacheService } from './inventory-cache.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inventory-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold mb-4">Inventario (Stock)</h2>
      </div>

      <div class="mb-4 flex items-center gap-2">
        <input [(ngModel)]="q" placeholder="Buscar (producto, sku, id)" class="input input-bordered w-full max-w-xs" />
        <button class="btn btn-sm" (click)="search()">Buscar</button>
      </div>

      <div class="mb-2 text-sm text-gray-400" *ngIf="loading && (!stock || stock.length === 0)">Actualizando datos…</div>

      <div class="overflow-hidden rounded-md">
        <table class="w-full bg-transparent">
              <thead class="z-10">
              <tr class="border-b border-neutral-700">
              <th class="text-left text-xs text-gray-400 uppercase tracking-wide py-3 px-2">ID</th>
              <th colspan="2" class="text-left text-xs text-gray-400 uppercase tracking-wide py-3 px-2">Producto</th>
              <th class="text-left text-xs text-gray-400 uppercase tracking-wide py-3 px-2">Almacén</th>
              <th class="text-right text-xs text-gray-400 uppercase tracking-wide py-3 px-2">Cantidad</th>
              <th class="text-right text-xs text-gray-400 uppercase tracking-wide py-3 px-2">Reservado</th>
            </tr>
          </thead>
          <tbody>
          <ng-container *ngIf="stock && stock.length > 0; else placeholderRows">
            <tr *ngFor="let s of stock" class="border-b border-neutral-800 hover:bg-white/2">
              <td class="py-3 px-2 text-sm text-gray-300">{{ s.id }}</td>
              <td class="py-3 px-2 text-sm text-gray-200">{{ s.product?.name || s.product_name || s.product_id }}</td>
              <td class="py-3 px-2" colspan="2">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                    <img *ngIf="s.product?.image_url" [src]="getImageUrl(s.product.image_url)" class="w-full h-full object-cover" (error)="onImageError($event)" />
                    <div *ngIf="!s.product?.image_url" class="w-full h-full flex items-center justify-center text-gray-500">
                      <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-gray-200 truncate">{{ s.product?.name || s.product_name || s.product_id }}</div>
                    <div class="text-xs text-gray-400 truncate">{{ s.product?.sku || s.sku || '-' }}</div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-2 text-sm text-gray-300">{{ s.warehouse?.name || s.warehouse_id || '-' }}</td>
              <td class="py-3 px-2 text-sm text-right text-gray-200">{{ s.quantity }}</td>
              <td class="py-3 px-2 text-sm text-right text-gray-300">{{ s.reserved || 0 }}</td>
            </tr>
          </ng-container>
          <ng-template #placeholderRows>
            <tr *ngFor="let _ of placeholders" class="border-b border-neutral-800">
              <td class="py-3 px-2 text-sm text-gray-500">—</td>
              <td class="py-3 px-2 text-sm text-gray-500">Cargando...</td>
              <td class="py-3 px-2 text-sm text-gray-500">—</td>
              <td class="py-3 px-2 text-sm text-gray-500">—</td>
              <td class="py-3 px-2 text-sm text-right text-gray-500">—</td>
              <td class="py-3 px-2 text-sm text-right text-gray-500">—</td>
            </tr>
          </ng-template>
        </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">Página {{ meta.current_page || 1 }} / {{ meta.last_page || 1 }}</div>
        <div class="space-x-2">
          <button class="btn btn-sm" (click)="goto((meta.current_page||1) - 1)" [disabled]="(meta.current_page||1) <= 1">Anterior</button>
          <button class="btn btn-sm" (click)="goto((meta.current_page||1) + 1)" [disabled]="(meta.current_page||1) >= (meta.last_page||1)">Siguiente</button>
        </div>
      </div>
    </div>
  `
})
export class InventoryProductsComponent implements OnInit {
  stock: any[] = [];
  loading = false;
  q = '';
  meta: any = { current_page: 1, last_page: 1 };
  placeholders = Array(8).fill(0);

  constructor(private svc: InventoryService, private cache: InventoryCacheService) {}

  ngOnInit(): void {
    // Try to show cached stock immediately for instant render (synchronous)
    const cached = this.cache.getCachedSync();
    if (cached && Array.isArray(cached)) {
      this.stock = cached;
      this.loading = false;
    } else {
      this.loading = true;
    }

    // subscribe to cache updates so any view shows fresh data immediately when available
    this.cache.cache$.subscribe((data) => {
      if (data && Array.isArray(data)) {
        this.stock = data;
        this.loading = false;
      }
    });

    // Always trigger a background refresh (first page)
    this.cache.refresh({ page: 1, per_page: 50 });
  }

  load(params: any = {}) {
    this.loading = true;
    const p = { q: this.q || undefined, ...params };
    // use cache service to refresh and update both cache + other subscribers
    this.cache.refresh(p).subscribe({
      next: (r) => {
        this.stock = r.data || r;
        this.meta = r.meta || this.meta;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  search() {
    this.load({ page: 1 });
  }

  goto(p: number) {
    if (p < 1) return;
    this.load({ page: p });
  }

  onImageError(event: any) {
    if (event && event.target) {
      event.target.style.display = 'none';
    }
  }

  getImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    if (!base) return url;
    if (url.startsWith('/')) return base + url;
    return base + '/' + url;
  }
}
