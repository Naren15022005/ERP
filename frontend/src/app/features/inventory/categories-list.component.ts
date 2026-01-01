import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Categorías</h2>
        <div>
          <button class="btn btn-sm btn-primary" (click)="openCreate()">Crear categoría</button>
        </div>
      </div>

      <div *ngIf="error" class="text-sm text-red-400 mb-3">{{ error }}</div>

      <div class="overflow-hidden rounded-md border border-neutral-800 bg-transparent">
        <div class="max-h-[60vh] overflow-auto">
          <table class="min-w-full w-full">
            <thead class="z-10">
              <tr class="border-b border-neutral-700">
                <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">#</th>
                <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Nombre</th>
                <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Descripción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-800">
              <tr *ngFor="let c of categories; let i = index" class="border-b border-neutral-800">
                <td class="py-3 px-3 text-sm text-gray-400">{{ i + 1 }}</td>
                <td class="py-3 px-3 text-sm text-gray-200">{{ c.name }} <span *ngIf="c._optimistic" class="text-xs text-yellow-300">(guardando...)</span></td>
                <td class="py-3 px-3 text-sm text-gray-300">{{ c.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreate" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50 z-40" (click)="closeCreate()"></div>
        <div (click)="$event.stopPropagation()" class="bg-neutral-900 border border-neutral-800 rounded-md p-4 z-50 w-full max-w-md max-h-[80vh] overflow-auto">
          <h3 class="text-lg font-semibold mb-3">Crear categoría</h3>
          <div class="space-y-3">
            <div *ngIf="createError" class="text-sm text-red-400">{{ createError }}</div>
            <div *ngIf="createSuccess" class="text-sm text-green-400">{{ createSuccess }}</div>
            <div>
              <label class="text-sm text-gray-400">Nombre</label>
              <input [value]="newCategory.name" (input)="newCategory.name = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
            </div>
            <div>
              <label class="text-sm text-gray-400">Descripción</label>
              <input [value]="newCategory.description" (input)="newCategory.description = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
            </div>
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost btn-sm" (click)="closeCreate()" [disabled]="creating">Cancelar</button>
              <button class="btn btn-primary btn-sm" (click)="submitCreate()" [disabled]="creating">{{ creating ? 'Creando...' : 'Crear' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryCategoriesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private inventoryService = inject(InventoryService);
  // private confirm = inject(ConfirmService);
  categories: any[] = [];
  showCreate = false;
  creating = false;
  createError: string | null = null;
  createSuccess: string | null = null;
  newCategory: any = { name: '', description: '' };
  error: string | null = null;

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('inventory_categories_cache');
      if (raw) {
        this.categories = JSON.parse(raw) || [];
      }
    } catch (e) {}
    this.load();
  }

  load() {
    this.error = null;
    this.inventoryService.listCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.categories = res || [];
        try { localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories)); localStorage.setItem('inventory_categories_cache_ts', String(Date.now())); } catch (e) {}
      },
      error: (err: any) => { this.error = err?.error?.message || err?.message || 'Error al cargar categorías'; }
    });
  }

  openCreate() { this.newCategory = { name: '', description: '' }; this.showCreate = true; this.createError = null; this.createSuccess = null; }
  closeCreate() { this.showCreate = false; }

  submitCreate() {
    this.createError = null; this.createSuccess = null;
    if (!this.newCategory.name || !this.newCategory.name.trim()) { this.createError = 'El nombre es obligatorio'; return; }

    // proceed immediately with optimistic insert (no confirmation)
    this._performCreate();
  }

  private _performCreate() {

    // optimistic insert
    const tempId = `temp_${Date.now()}`;
    const temp = { id: tempId, name: this.newCategory.name, description: this.newCategory.description || '', _optimistic: true };
    this.categories = this.categories || [];
    this.categories.unshift(temp);
    try { localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories)); localStorage.setItem('inventory_categories_cache_ts', String(Date.now())); } catch (e) {}

    this.showCreate = false;
    this.creating = true;
    this.inventoryService.createCategory({ name: temp.name, description: temp.description }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const idx = this.categories.findIndex(c => c.id === tempId);
        if (idx >= 0) {
          this.categories[idx] = { ...(res || {}), _optimistic: false };
          try { localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories)); } catch (e) {}
        }
        this.createSuccess = 'Categoría creada correctamente.';
        setTimeout(() => this.createSuccess = null, 3000);
      },
      error: (err: any) => {
        this.createError = err?.error?.message || err?.message || 'Error al crear categoría';
        this.categories = (this.categories || []).filter(c => c.id !== tempId);
        try { localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories)); } catch (e) {}
      },
      complete: () => { this.creating = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
