import { Component, OnInit, inject } from '@angular/core';
import { take, filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { environment } from '../../../environments/environment';
import { InventoryService } from '../inventory/inventory.service';
// import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-4">Productos</h2>
      <div *ngIf="categorySuccess" class="text-sm text-green-400 mb-2">{{ categorySuccess }}</div>
      <div *ngIf="productSuccess" class="text-sm text-green-400 mb-2">{{ productSuccess }}</div>

      <div class="mb-4">
        <div class="flex justify-end">
          <div class="w-full flex justify-end">
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 flex-shrink-0">
                <button class="btn btn-sm btn-primary text-sm flex-shrink-0" (click)="openCreateProduct()">Agregar nuevo</button>
                <button class="btn btn-sm btn-ghost text-sm flex-shrink-0" (click)="openCreateCategory()">Categoría</button>
              </div>
              <div class="relative flex-1 min-w-0 max-w-xs">
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
            </div>

              <div class="mt-2 flex items-center justify-end text-sm text-gray-400">
              <div *ngIf="meta?.total" class="mr-3">Registros: {{ meta.total }}</div>
              <!-- Background refresh is now silent; no 'Actualizando…' badge to keep UX instant -->
            </div>
          </div>
        </div>
      </div>

        <!-- Edit Product Modal -->
        <div *ngIf="editingProduct" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 z-40" (click)="closeEditProduct()"></div>
          <div (click)="$event.stopPropagation()" class="bg-neutral-900 border border-neutral-800 rounded-md p-4 z-50 w-full max-w-lg max-h-[80vh] overflow-auto">
            <h3 class="text-lg font-semibold mb-3">Editar producto</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-400">Nombre</label>
                <input [value]="editingProduct.name" (input)="editingProduct.name = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <div>
                <label class="text-sm text-gray-400">Precio</label>
                <input type="number" [value]="editingProduct.price" (input)="editingProduct.price = $any($event.target).valueAsNumber" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <div>
                <label class="text-sm text-gray-400">Imagen</label>
                <input type="file" accept="image/*" (change)="onEditImageFileSelected($event)" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
                <div *ngIf="editingProduct.image_preview || editingProduct.image_url" class="mt-2">
                  <div class="text-xs text-gray-400 mb-1">Vista previa:</div>
                  <div class="w-20 h-20 rounded border border-neutral-700 overflow-hidden bg-neutral-800">
                    <img [src]="editingProduct.image_preview || getImageUrl(editingProduct.image_url)" [alt]="editingProduct.name" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div>
                <label class="text-sm text-gray-400">Categoría</label>
                <select [value]="editingProduct.category_id" (change)="editingProduct.category_id = $any($event.target).value ? +$any($event.target).value : null" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm">
                  <option [value]="">Sin categoría</option>
                  <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div *ngIf="editingProductError" class="text-sm text-red-400">{{ editingProductError }}</div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-ghost btn-sm" (click)="closeEditProduct()" [disabled]="editingProductLoading">Cancelar</button>
                <button class="btn btn-primary btn-sm" (click)="submitEditProduct()" [disabled]="editingProductLoading || editUploadingImage">{{ editingProductLoading ? 'Guardando...' : (editUploadingImage ? 'Subiendo imagen...' : 'Guardar') }}</button>
              </div>
            </div>
          </div>
        </div>

      <div class="relative">
           <!-- Blocking full-screen spinner removed so placeholders/table are visible immediately
             Placeholders in the table render when loading is true, giving instant perceived render. -->

        <!-- Silent background refresh: spinner removed so table appears instantly -->

        <div class="overflow-hidden rounded-md border border-neutral-800 bg-transparent">
          <div class="max-h-[60vh] overflow-auto">
            <table class="min-w-full w-full">
              <thead class="z-20">
                <tr class="border-b border-neutral-700">
                  <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">#</th>
                  <th colspan="2" class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Producto</th>
                  <th class="text-right text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Precio</th>
                  <th class="text-left text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Categoría</th>
                  <th class="text-center text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Estado</th>
                  <th class="text-center text-sm text-gray-400 uppercase tracking-wide py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-800">
                <!-- If loading, show placeholder rows immediately so the page appears responsive -->
                <ng-container *ngIf="loading">
                  <tr *ngFor="let _ of placeholders" class="border-b border-neutral-800">
                    <td class="py-3 px-3 text-sm text-gray-600">—</td>
                    <td class="py-3 px-3 text-sm text-gray-600">—</td>
                    <td class="py-3 px-3 text-sm text-gray-600">Cargando...</td>
                    <td class="py-3 px-3 text-sm text-right text-gray-600">—</td>
                    <td class="py-3 px-3 text-sm text-gray-600">—</td>
                    <td class="py-3 px-3 text-sm text-center text-gray-600">—</td>
                    <td class="py-3 px-3 text-sm text-center text-gray-600">—</td>
                  </tr>
                </ng-container>

                <!-- When not loading and no products, show empty state -->
                <tr *ngIf="!loading && (!products || products.length === 0)" class="h-40">
                  <td colspan="7" class="text-center text-gray-400 py-8">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 7h18M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                      </svg>
                      <div class="text-sm">No hay registros para mostrar</div>
                    </div>
                  </td>
                </tr>

                <!-- Actual data rows -->
                <tr *ngFor="let p of products; let i = index" (click)="openDetail(p)" role="button" class="cursor-pointer border-b border-neutral-800" [ngClass]="{ 'bg-white/1': (i % 2) === 1, 'hover:bg-white/2': true }">
                  <td class="py-3 px-3 text-sm text-gray-400">{{ getRowNumber(i) }}</td>
                  <td class="py-3 px-3" colspan="2">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img *ngIf="p.image_url || p.image_preview" [src]="p.image_url ? getImageUrl(p.image_url) : p.image_preview" [alt]="p.name" class="w-full h-full object-cover" (error)="onImageError($event)" />
                        <div *ngIf="!p.image_url && !p.image_preview" class="w-full h-full flex items-center justify-center text-gray-500">
                          <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-200 truncate">{{ p.name }}</div>
                        <div *ngIf="p.sku" class="text-xs text-gray-400 truncate">SKU {{ p.sku }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-sm text-right text-gray-200">{{ p.price ? (p.price | currency) : '-' }}</td>
                  <td class="py-3 px-3 text-sm text-gray-300">{{ p.category?.name || p.category_name || '-' }}</td>
                  <td class="py-3 px-3 text-sm text-center">
                    <span [ngClass]="getStatusBadgeClass(p)" class="inline-block px-2 py-1 rounded-full text-xs font-semibold">
                      {{ getStatusLabel(p) }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-sm text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button class="btn btn-ghost btn-xs" (click)="$event.stopPropagation(); openEditProduct(p)">Editar</button>
                      <button class="btn btn-ghost btn-xs text-red-400" (click)="$event.stopPropagation(); deleteProduct(p)">Eliminar</button>
                    </div>
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
        <div *ngIf="selectedProduct" class="fixed right-0 top-0 h-full w-96 bg-neutral-900/90 border-l border-neutral-800 p-4 z-40 overflow-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-lg font-semibold">{{ selectedProduct.name }}</div>
              <div class="text-sm text-gray-400">Detalle de producto</div>
            </div>
            <button (click)="closeDetail()" class="btn btn-ghost btn-sm">Cerrar</button>
          </div>

          <div class="space-y-3 text-sm text-gray-200">
            <div><strong>Código de barras:</strong> {{ selectedProduct.barcode || '-' }}</div>
            <div><strong>Precio:</strong> {{ selectedProduct.price ? (selectedProduct.price | number:'1.2-2') : '-' }}</div>
            <div><strong>Categoría:</strong> {{ selectedProduct.category?.name || '-' }}</div>
            <div><strong>Descripción:</strong>
              <div class="text-xs text-gray-400 mt-1">{{ selectedProduct.description || '-' }}</div>
            </div>
            <div><strong>Creado:</strong> {{ selectedProduct.created_at | date:'medium' }}</div>
          </div>
        </div>

        <!-- Create Category Modal -->
        <div *ngIf="showCreateCategory" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 z-40" (click)="closeCreateCategory()"></div>
          <div (click)="$event.stopPropagation()" class="bg-neutral-900 border border-neutral-800 rounded-md p-4 z-50 w-full max-w-md max-h-[80vh] overflow-auto">
            <h3 class="text-lg font-semibold mb-3">Crear categoría</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-400">Nombre</label>
                <input [value]="newCategory.name" (input)="newCategory.name = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <div>
                <label class="text-sm text-gray-400">Descripción</label>
                <input [value]="newCategory.description" (input)="newCategory.description = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <div *ngIf="categoryError" class="text-sm text-red-400">{{ categoryError }}</div>
              <div *ngIf="categorySuccess" class="text-sm text-green-400">{{ categorySuccess }}</div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-ghost btn-sm" (click)="closeCreateCategory()" [disabled]="creatingCategory">Cancelar</button>
                <button class="btn btn-primary btn-sm" (click)="submitCreateCategory()" [disabled]="creatingCategory">{{ creatingCategory ? 'Creando...' : 'Crear' }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Product Modal -->
        <div *ngIf="showCreateProduct" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 z-40" (click)="closeCreateProduct()"></div>
          <div (click)="$event.stopPropagation()" class="bg-neutral-900 border border-neutral-800 rounded-md p-4 z-50 w-full max-w-lg max-h-[80vh] overflow-auto">
            <h3 class="text-lg font-semibold mb-3">Crear producto</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-400">Nombre</label>
                <input [value]="newProduct.name" (input)="newProduct.name = $any($event.target).value" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <!-- SKU is generated by the backend and is not shown to the user -->
              <div>
                <label class="text-sm text-gray-400">Precio</label>
                <input type="number" [value]="newProduct.price" (input)="newProduct.price = $any($event.target).valueAsNumber" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
              </div>
              <div>
                <label class="text-sm text-gray-400">URL de imagen</label>
                <input type="file" accept="image/*" (change)="onImageFileSelected($event)" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm" />
                <div *ngIf="imagePreview || newProduct.image_url" class="mt-2">
                  <div class="text-xs text-gray-400 mb-1">Vista previa:</div>
                  <div class="w-20 h-20 rounded border border-neutral-700 overflow-hidden bg-neutral-800">
                    <img [src]="imagePreview || getImageUrl(newProduct.image_url)" [alt]="newProduct.name" class="w-full h-full object-cover" (error)="onImageError($event)" />
                  </div>
                </div>
              </div>
              <div>
                <label class="text-sm text-gray-400">Categoría</label>
                <select [value]="newProduct.category_id" (change)="newProduct.category_id = $any($event.target).value ? +$any($event.target).value : null" class="w-full mt-1 p-2 rounded bg-neutral-800 border border-neutral-700 text-sm">
                  <option [value]="">Sin categoría</option>
                  <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div *ngIf="productError" class="text-sm text-red-400">{{ productError }}</div>
              <div *ngIf="productSuccess" class="text-sm text-green-400">{{ productSuccess }}</div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-ghost btn-sm" (click)="closeCreateProduct()" [disabled]="creatingProduct">Cancelar</button>
                <button class="btn btn-primary btn-sm" (click)="submitCreateProduct()" [disabled]="creatingProduct || uploadingImage">{{ creatingProduct ? 'Creando...' : (uploadingImage ? 'Subiendo imagen...' : 'Crear producto') }}</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ProductsListComponent implements OnInit {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);
  // confirmation removed: actions execute immediately

  // UI state for create modals
  showCreateCategory = false;
  showCreateProduct = false;
  categories: any[] = [];
  newCategory: any = { name: '', description: '' };
  newProduct: any = { name: '', price: null, category_id: null, image_url: '' };
  imagePreview: string | null = null;
  creatingCategory = false;
  creatingProduct = false;
  uploadingImage = false;
  categoryError: string | null = null;
  productError: string | null = null;
  categorySuccess: string | null = null;
  productSuccess: string | null = null;

  products: any[] = [];
  loading = false;
  error: string | null = null;
  q = '';
  meta: any = { current_page: 1, last_page: 1 };
  placeholders = Array(8).fill(0);
  selectedProduct: any = null;
  per_page = 25;
  hasCache = false;
  updating = false;

  ngOnInit(): void {
    // Ensure any global overlay (shown during navigation) is cleared when Angular component mounts
    try { (window as any).__clearProductsCacheOverlay && (window as any).__clearProductsCacheOverlay(); } catch(e) {}

    // Try synchronous cache-first render for immediate UX
    try {
      const raw = localStorage.getItem('products_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.products = parsed?.data || parsed || [];
        this.meta = parsed?.meta || this.meta;
        this.hasCache = true;
        this.loading = false;
      } else {
        this.loading = true;
      }
    } catch (e) {
      this.loading = true;
    }

    // Trigger background refresh only after authentication to avoid unauthenticated
    // responses overwriting the cached products with empty results.
    if (this.authService.isAuthenticated) {
      this.refresh({ page: 1 });
    } else {
      this.authService.currentUser$.pipe(filter(u => !!u), take(1)).subscribe(() => this.refresh({ page: 1 }));
    }
  }

  loadProducts(params: any = {}, options: { background?: boolean } = {}): void {
    const background = !!options.background;
    // Background refreshes are silent: only show loading for non-background loads
    if (!background) {
      this.loading = true;
    }

    this.error = null;
    const p = { q: this.q || undefined, page: params.page || 1, per_page: this.per_page };
    this.productService.list(p).subscribe({
      next: (res: any) => {
        let data: any[] = [];
        let meta: any = this.meta || { current_page: 1, last_page: 1, total: 0, per_page: this.per_page };
        if (Array.isArray(res)) {
          data = res;
          meta = { current_page: 1, last_page: 1, total: (res as any).length || 0, per_page: this.per_page };
        } else {
          data = res.data || [];
          meta = res.meta || meta;
        }

        // Apply response to UI. Background refreshes will now overwrite the
        // local cache even if the server returns an empty list — this ensures
        // the frontend accurately reflects the backend state instead of
        // showing stale optimistic data indefinitely.

        // Apply response to UI
        this.products = data;
        this.meta = meta;

        // persist cache (data + meta)
        try {
          localStorage.setItem('products_cache', JSON.stringify({ data: this.products, meta: this.meta }));
          localStorage.setItem('products_cache_ts', String(Date.now()));
          this.hasCache = true;
        } catch (e) {
          // ignore storage errors
        }
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.message || 'Error al cargar productos';
      },
      complete: () => { this.loading = false; this.updating = false; }
    });
  }

  search() { this.loadProducts({ page: 1 }, { background: false }); }

  goto(p: number) {
    if (p < 1) return;
    // preserve cache-first behavior: page navigation triggers background refresh if cache exists
    this.loadProducts({ page: p }, { background: this.hasCache });
  }

  refresh(params: any = {}) {
    // background refresh by default (non-blocking when cache present)
    this.loadProducts(params, { background: true });
  }

  // Persist products cache helper (used after optimistic updates)
  persistProductsCache() {
    try {
      // Do not persist transient blob preview URLs — they are only valid
      // within the current browsing session and cause ERR_FILE_NOT_FOUND
      // when the app reloads. Clone and strip any `image_preview` that
      // starts with a blob: URL before saving to localStorage.
      const safeProducts = (this.products || []).map(p => {
        try {
          const copy = { ...(p || {}) };
          if (typeof copy.image_preview === 'string' && copy.image_preview.startsWith('blob:')) {
            delete copy.image_preview;
          }
          return copy;
        } catch (e) { return p; }
      });
      localStorage.setItem('products_cache', JSON.stringify({ data: safeProducts, meta: this.meta }));
      localStorage.setItem('products_cache_ts', String(Date.now()));
      this.hasCache = true;
    } catch (e) { /* ignore */ }
  }

  // Persist categories cache helper
  persistCategoriesCache() {
    try {
      localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories || []));
      localStorage.setItem('inventory_categories_cache_ts', String(Date.now()));
    } catch (e) { /* ignore */ }
  }

  getRowNumber(index: number) {
    const page = this.meta.current_page || 1;
    const per = this.meta.per_page || this.per_page;
    return (page - 1) * per + index + 1;
  }

  openDetail(p: any) { this.selectedProduct = p; }
  closeDetail() { this.selectedProduct = null; }

  getStatusLabel(p: any) {
    if (p.active === false || p.is_active === false || p.status === 'inactive') return 'INACTIVO';
    return 'ACTIVO';
  }

  getStatusClass(p: any) {
    return (p.active === false || p.is_active === false || p.status === 'inactive') ? 'bg-red-800 text-red-200' : 'bg-green-800 text-green-200';
  }

  getStatusBadgeClass(p: any) {
    return this.getStatusClass(p);
  }

  // --- Create / Category helpers ---
  openCreateCategory() {
    this.newCategory = { name: '', description: '' };
    this.showCreateCategory = true;
  }

  closeCreateCategory() {
    this.showCreateCategory = false;
  }

  submitCreateCategory() {
    this.categoryError = null;
    this.categorySuccess = null;
    if (!this.newCategory.name || !this.newCategory.name.trim()) { this.categoryError = 'El nombre es obligatorio'; return; }
    if (!this.authService.isAuthenticated) { this.categoryError = 'No autenticado. Inicia sesión para crear categorías.'; return; }
    // proceed immediately with optimistic insert (no confirmation)
    const tempId = `temp_${Date.now()}`;
    const tempCat: any = { id: tempId, name: this.newCategory.name, description: this.newCategory.description || '', _optimistic: true };
    this.categories = this.categories || [];
    this.categories.unshift(tempCat);
    this.persistCategoriesCache();

    // close modal immediately for perceived instant response
    this.showCreateCategory = false;

    // send request in background
    this.creatingCategory = true;
    const payload = { name: tempCat.name, description: tempCat.description };
    this.inventoryService.createCategory(payload).subscribe({
      next: (res: any) => {
        // replace temp with real record if present
        const idx = this.categories.findIndex(c => c.id === tempId);
        if (idx >= 0) {
          this.categories[idx] = { ...(res || {}), _optimistic: false };
          this.persistCategoriesCache();
        } else {
          try { this.inventoryService.listCategories().subscribe(r => { this.categories = r || []; this.persistCategoriesCache(); }); } catch (e) {}
        }
        // if the product modal was open for immediate assign, set it
        if (this.showCreateProduct && res && res.id) this.newProduct.category_id = res.id;
        // show quick success flash
        this.categorySuccess = 'Categoría creada correctamente.';
        setTimeout(() => this.categorySuccess = null, 3000);
      },
      error: (err: any) => {
        console.error('createCategory error', err);
        this.categoryError = err?.error?.message || err?.message || 'Error al crear categoría';
        // revert optimistic insert
        this.categories = (this.categories || []).filter(c => c.id !== tempId);
        this.persistCategoriesCache();
      },
      complete: () => { this.creatingCategory = false; }
    });
  }

  // --- Create product helpers ---
  openCreateProduct() {
    this.newProduct = { name: '', sku: '', price: null, category_id: null, image_url: '' };
    // Try to load categories from local cache first for immediate UX, then refresh from API
    try {
      const raw = localStorage.getItem('inventory_categories_cache');
      if (raw) this.categories = JSON.parse(raw) || [];
    } catch (e) { this.categories = []; }

    // Refresh categories from backend in background
    try { this.inventoryService.listCategories().subscribe(r => { this.categories = r || []; try { localStorage.setItem('inventory_categories_cache', JSON.stringify(this.categories)); localStorage.setItem('inventory_categories_cache_ts', String(Date.now())); } catch(e){} }); } catch (e) {}

    this.showCreateProduct = true;
  }

  closeCreateProduct() { this.showCreateProduct = false; }

  submitCreateProduct() {
    this.productError = null;
    this.productSuccess = null;
    if (!this.newProduct.name || !this.newProduct.name.trim()) { this.productError = 'El nombre es obligatorio'; return; }
    if (!this.authService.isAuthenticated) { this.productError = 'No autenticado. Inicia sesión para crear productos.'; return; }

    // proceed immediately with optimistic product insert (no confirmation)
    const tempId = `temp_${Date.now()}`;
    const tempProd: any = {
      id: tempId,
      name: this.newProduct.name,
      price: this.newProduct.price || null,
      category_id: this.newProduct.category_id || null,
      category: this.categories?.find(c => c.id === this.newProduct.category_id) || null,
      image_url: this.newProduct.image_url || null,
      image_preview: this.imagePreview || null,
      _optimistic: true
    };
    this.products = this.products || [];
    this.products.unshift(tempProd);
    // bump total if present
    if (this.meta && typeof this.meta.total === 'number') this.meta.total = (this.meta.total || 0) + 1;
    this.persistProductsCache();

    // close modal immediately
    this.showCreateProduct = false;

    // send request in background
    this.creatingProduct = true;
    // If the user selected a file but we haven't uploaded it yet, send multipart with file
    const pendingFile: File | undefined = this.newProduct._pendingImageFile;
    let requestPayload: any;
    if (pendingFile) {
      const fd = new FormData();
      fd.append('name', this.newProduct.name);
      if (this.newProduct.price != null) fd.append('price', String(this.newProduct.price));
      if (this.newProduct.category_id != null) fd.append('category_id', String(this.newProduct.category_id));
      // Attach the file under 'image' so backend fallback handles storing it
      fd.append('image', pendingFile);
      requestPayload = fd;
    } else {
      requestPayload = {
        name: this.newProduct.name,
        price: this.newProduct.price || undefined,
        category_id: this.newProduct.category_id || undefined,
        image_url: this.newProduct.image_url || undefined
      };
    }

    // Debug: log payload after it has been prepared
    try {
      console.debug('submitCreateProduct: sending payload', requestPayload);
      if (requestPayload instanceof FormData) {
        try {
          Array.from((requestPayload as any).entries()).forEach((pair: any) => console.debug('submitCreateProduct: formdata entry', pair[0], pair[1]));
        } catch (e) { /* ignore */ }
      }
    } catch (e) { console.debug('submitCreateProduct: debug log error', e); }

    this.productService.create(requestPayload).subscribe({
      next: (res: any) => {
        // normalize response (some endpoints may wrap in `data`)
        const serverProduct = (res && res.data) ? res.data : res;
        console.info('create product response', serverProduct);
        // replace temp with server response using robust matching
        const serverId = serverProduct?.id;
        let replaced = false;

        // 1) exact tempId match
        let idx = this.products.findIndex(p => p.id === tempId);
        if (idx >= 0) {
          this.products[idx] = { ...(serverProduct || {}), _optimistic: false, image_preview: null };
          // If server didn't include category relation, attach from cached categories if possible
          try {
            const catId = this.products[idx].category_id ?? this.products[idx].category?.id;
            if (!this.products[idx].category && catId) {
              this.products[idx].category = (this.categories || []).find((c: any) => c.id == catId) || null;
            }
          } catch (e) {}
          replaced = true;
        }

        // 2) if not found, try match by server id
        if (!replaced && serverId) {
          idx = this.products.findIndex(p => p.id === serverId);
          if (idx >= 0) {
            this.products[idx] = { ...(serverProduct || {}), _optimistic: false, image_preview: null };
            try {
              const catId = this.products[idx].category_id ?? this.products[idx].category?.id;
              if (!this.products[idx].category && catId) {
                this.products[idx].category = (this.categories || []).find((c: any) => c.id == catId) || null;
              }
            } catch (e) {}
            replaced = true;
          }
        }

        // 3) if still not found, try to match an optimistic row by name+price
        if (!replaced) {
          idx = this.products.findIndex(p => p._optimistic && p.name === serverProduct?.name && (p.price == serverProduct?.price));
          if (idx >= 0) {
            this.products[idx] = { ...(serverProduct || {}), _optimistic: false, image_preview: null };
            try {
              const catId = this.products[idx].category_id ?? this.products[idx].category?.id;
              if (!this.products[idx].category && catId) {
                this.products[idx].category = (this.categories || []).find((c: any) => c.id == catId) || null;
              }
            } catch (e) {}
            replaced = true;
          }
        }

        // 4) fallback: insert server product at top
        if (!replaced) {
          const newProd = { ...(serverProduct || {}), _optimistic: false, image_preview: null };
          try { const catId = newProd.category_id ?? newProd.category?.id; if (!newProd.category && catId) newProd.category = (this.categories || []).find((c: any) => c.id == catId) || null; } catch(e) {}
          this.products.unshift(newProd);
        }

        this.persistProductsCache();

        // If server didn't include SKU, try to fetch fresh product by id
        if (serverId && !serverProduct?.sku) {
          this.productService.show(serverId).subscribe({ next: (fresh: any) => {
            const findIdx = this.products.findIndex(p => p.id === serverId);
            if (findIdx >= 0) {
              this.products[findIdx] = { ...(fresh || serverProduct || {}), _optimistic: false };
              this.persistProductsCache();
            }
          }, error: () => {} });
        }
        // Clear pending file reference after successful create
        try { delete this.newProduct._pendingImageFile; } catch (e) {}
        this.productSuccess = 'Producto creado correctamente.';
        setTimeout(() => this.productSuccess = null, 3000);
      },
      error: (err: any) => {
        console.error('createProduct error', err);
        this.productError = err?.error?.message || err?.message || 'Error al crear producto';
        // revert optimistic insert
        this.products = (this.products || []).filter(p => p.id !== tempId);
        if (this.meta && typeof this.meta.total === 'number') this.meta.total = Math.max(0, (this.meta.total || 1) - 1);
        this.persistProductsCache();
        try { delete this.newProduct._pendingImageFile; } catch (e) {}
      },
      complete: () => { this.creatingProduct = false; }
    });
  }

  // --- Edit product helpers ---
  editingProduct: any = null;
  editingIndex: number | null = null;
  editingProductError: string | null = null;
  editingProductLoading = false;
  editUploadingImage = false;

  openEditProduct(p: any) {
    // If this is an optimistic temporary product (not yet persisted), block editing
    if (!p || !p.id) return;
    if (typeof p.id === 'string' && p.id.startsWith('temp_')) {
      this.editingProductError = 'Producto aún guardándose. Espera a que termine la creación antes de editar.';
      setTimeout(() => this.editingProductError = null, 3000);
      return;
    }
    // clone to avoid mutating list until save
    this.editingProduct = { ...(p || {}) };
    this.editingIndex = this.products.findIndex(x => x.id === p.id);
  }

  closeEditProduct() {
    this.editingProduct = null;
    this.editingIndex = null;
    this.editingProductError = null;
    this.editingProductLoading = false;
    this.editUploadingImage = false;
  }

  submitEditProduct() {
    if (!this.editingProduct) return;
    if (typeof this.editingProduct.id === 'string' && this.editingProduct.id.startsWith('temp_')) {
      this.editingProductError = 'No se puede editar: el producto aun no fue guardado en el servidor.';
      return;
    }
    if (!this.editingProduct.name || !this.editingProduct.name.trim()) { this.editingProductError = 'El nombre es obligatorio'; return; }
    this.editingProductError = null;
    this.editingProductLoading = true;
    const payload: any = {
      name: this.editingProduct.name,
      price: this.editingProduct.price || undefined,
      category_id: this.editingProduct.category_id || undefined,
      image_url: this.editingProduct.image_url || undefined,
      description: this.editingProduct.description || undefined,
      is_active: this.editingProduct.is_active,
    };
    this.productService.update(this.editingProduct.id, payload).subscribe({
      next: (res: any) => {
        const serverProduct = (res && res.data) ? res.data : res;
        console.info('edit product response', serverProduct);
        // replace in list
        if (this.editingIndex != null && this.editingIndex >= 0) {
          this.products[this.editingIndex] = { ...(serverProduct || {}), _optimistic: false };
          this.persistProductsCache();
        } else {
          this.refresh({ page: 1 });
        }
        this.closeEditProduct();
      },
      error: (err: any) => {
        console.error('editProduct error', err);
        this.editingProductError = err?.error?.message || err?.message || 'Error al actualizar producto';
      },
      complete: () => { this.editingProductLoading = false; }
    });
  }

  onEditImageFileSelected(ev: any) {
    const f: File = ev?.target?.files?.[0];
    if (!f || !this.editingProduct) return;
    this.editUploadingImage = true;
    try { this.editingProduct.image_preview = URL.createObjectURL(f); } catch(e) { this.editingProduct.image_preview = null; }
    this.productService.uploadImage(f).subscribe({
      next: (res: any) => {
        if (res && res.url) this.editingProduct.image_url = res.url;
        try { if (this.editingProduct.image_preview && this.editingProduct.image_preview.startsWith('blob:')) URL.revokeObjectURL(this.editingProduct.image_preview); } catch(e) {}
        this.editingProduct.image_preview = null;
        this.editUploadingImage = false;
      },
      error: (err: any) => {
        console.error('edit image upload error', err);
        this.editingProductError = err?.error?.message || 'Error al subir imagen (edición)';
        this.editUploadingImage = false;
      },
      complete: () => { this.editUploadingImage = false; }
    });
  }

  deleteProduct(p: any) {
    if (!p || !p.id) return;
    // If optimistic temp item, just remove locally
    if (typeof p.id === 'string' && p.id.startsWith('temp_')) {
      if (!confirm('Eliminar el elemento no guardado localmente?')) return;
      this.products = (this.products || []).filter(x => x.id !== p.id);
      if (this.meta && typeof this.meta.total === 'number') this.meta.total = Math.max(0, (this.meta.total || 1) - 1);
      this.persistProductsCache();
      return;
    }

    if (!confirm('¿Eliminar producto? Esta acción no se puede deshacer.')) return;

    // Optimistically remove the item from UI for immediate feedback
    const originalProducts = [...(this.products || [])];
    this.products = (this.products || []).filter(x => x.id !== p.id);
    if (this.meta && typeof this.meta.total === 'number') this.meta.total = Math.max(0, (this.meta.total || 1) - 1);
    this.persistProductsCache();

    this.productService.delete(p.id).subscribe({
      next: () => {
        console.info('delete product success', p.id);
      },
      error: (err: any) => {
        console.error('deleteProduct error', err);
        this.productError = err?.error?.message || err?.message || 'Error al eliminar producto';
        // restore original list on error
        this.products = originalProducts;
        try { this.persistProductsCache(); } catch(e) {}
      }
    });
  }

  onImageError(event: any) {
    // Si la imagen falla al cargar, oculta el elemento img y muestra el placeholder
    if (event.target) {
      event.target.style.display = 'none';
    }
  }

  onImageFileSelected(ev: any) {
    const f: File = ev?.target?.files?.[0];
    if (!f) return;
    // Do NOT auto-upload. Store file to send with create request later (background),
    // and show immediate preview via object URL so UI is instant.
    this.productError = null;
    try {
      this.imagePreview = URL.createObjectURL(f);
    } catch (e) { this.imagePreview = null; }
    // Keep reference to file so submitCreateProduct can include it in multipart request
    this.newProduct._pendingImageFile = f;
    try { console.debug('onImageFileSelected: file selected', { name: f.name, size: f.size, type: f.type }); } catch(e) {}
    // uploadingImage not used here because we don't block create; keep false
    this.uploadingImage = false;
  }

  getImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    // If URL already absolute (http/https), return as-is
    if (/^https?:\/\//i.test(url)) return url;
    // For relative storage paths, prefix with the API origin (strip trailing /api if present)
    // e.g. environment.apiUrl = 'http://localhost:8000/api' -> origin = 'http://localhost:8000'
    const apiUrl = (environment.apiUrl || '').replace(/\/$/, '');
    const origin = apiUrl.replace(/\/api$/i, '');
    if (!origin) return url;
    if (url.startsWith('/')) return origin + url;
    return origin + '/' + url;
  }
}
