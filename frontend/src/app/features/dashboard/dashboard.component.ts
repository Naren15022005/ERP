import { Component, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';
import { DashboardService, DashboardWidget } from '../../core/services/dashboard.service';
import { ChartsService, ChartConfig } from '../../core/services/charts.service';
import { DashboardGridComponent } from './dashboard-grid/dashboard-grid.component';
import { GridOverlayComponent } from './grid-overlay/grid-overlay.component';
import { ChartRendererComponent } from './chart-renderer/chart-renderer.component';
import { AlertService } from '../../core/services/alert.service';
import { ResizableContainerComponent, ResizeData } from './resizable-container/resizable-container.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardGridComponent, ChartRendererComponent, ResizableContainerComponent, GridOverlayComponent],
  template: `
    <div class="p-6 relative">
      <!-- Menu button in top-right corner -->
      @if (allowEdit) {
      <div class="absolute top-4 right-4 z-10">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle btn-sm hover:bg-base-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
            <li>
              <a (click)="toggleEditMode()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {{ editMode ? 'Guardar Dashboard' : 'Editar Dashboard' }}
              </a>
                </li>
          </ul>
        </div>
      </div>
      }

      <div class="mb-6">
        @if (currentUser) {
          <p class="text-gray-600 mt-2">Bienvenido, {{ currentUser.name }}</p>
          @if (currentUser.tenant) {
            <p class="text-sm text-gray-500">{{ currentUser.tenant.name }}</p>
          }
        }
      </div>
      
      @if (editMode) {
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Modo edición: Arrastra los widgets para reordenarlos. Usa los controles para cambiar el tamaño.</span>
        </div>
      }

      <!-- Dynamic Widgets Grid is rendered inside the main dashboard root below so all items share coordinates -->

      <!-- Combined layout: left column for quick actions & alerts, right column for stacked charts -->
      <div class="mt-6 relative" #dashboardRoot tabindex="0" [style.height.px]="editMode ? getContainerHeight() : 'auto'">
        <app-grid-overlay [visible]="showGrid" [containerWidth]="containerWidth" [containerHeight]="containerHeight" [cellSize]="gridCellSize" [highlight]="gridHighlight"></app-grid-overlay>

        <ng-container *ngIf="layoutApplied">
        <!-- Render widgets inside dashboard root so they share the same coordinate space as other elements -->
        @if (widgets$ | async; as widgets) {
          @if (widgets.length > 0) {
            <app-dashboard-grid [widgets]="widgets" [editMode]="editMode" (layoutChange)="onLayoutChange($event)" [layoutStorageSuffix]="layoutStorageSuffix" [selectedId]="selectedId" (elementSelected)="onSelected($event)" [containerWidth]="containerWidth" [containerHeight]="containerHeight"></app-dashboard-grid>
          } @else {
            <div class="alert alert-info">
              <span>No hay widgets configurados para tu plan actual.</span>
            </div>
          }
        } @else {
          <div class="flex justify-center items-center h-24 mb-4">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        }
        <!-- Quick Actions -->
          <app-resizable-container
            elementId="quick-actions"
            [editMode]="editMode"
            [initialWidth]="getElementSize('quick-actions').width"
            [initialHeight]="getElementSize('quick-actions').height"
            [initialX]="getElementPosition('quick-actions').x"
            [initialY]="getElementPosition('quick-actions').y"
            [containerWidth]="containerWidth"
            [containerHeight]="containerHeight"
            [position]="elementSizes['quick-actions'] || null"
            [selectedId]="selectedId"
            (selected)="onSelected($event)"
            [minWidth]="250"
            [minHeight]="editMode ? 80 : 150"
            (resized)="onElementChange($event)"
            (moved)="onElementChange($event)"
            (moving)="onElementMoving($event)"
          >
          <div class="card bg-base-100 shadow-sm w-full rounded-[8px] bg-card">
            <div class="card-body p-2">
              <h2 class="card-title">Acciones Rápidas</h2>
              <div class="flex flex-col sm:flex-row sm:items-stretch gap-2 mt-2">
                <button class="btn btn-outline inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap w-full sm:flex-1 min-w-0 min-h-[36px] leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="truncate">Nueva Venta</span>
                </button>
                <button class="btn btn-outline inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap w-full sm:flex-1 min-w-0 min-h-[36px] leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="truncate">Producto</span>
                </button>
                <button *ngIf="!isSingleUser" class="btn btn-outline btn-accent inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap w-full sm:flex-1 min-w-0 min-h-[36px] leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="truncate">Nuevo Usuario</span>
                </button>
                <button class="btn btn-outline inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-[3px] text-[11px] sm:text-[13px] whitespace-nowrap w-full sm:flex-1 min-w-0 min-h-[36px] leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="truncate">Ver Reportes</span>
                </button>
              </div>
            </div>
          </div>
        </app-resizable-container>

        <!-- Alerts -->
        <app-resizable-container
          elementId="alerts"
          [editMode]="editMode"
          [initialWidth]="getElementSize('alerts').width"
          [initialHeight]="getElementSize('alerts').height"
          [initialX]="getElementPosition('alerts').x"
          [initialY]="getElementPosition('alerts').y"
          [containerWidth]="containerWidth"
          [containerHeight]="containerHeight"
          [position]="elementSizes['alerts'] || null"
          [selectedId]="selectedId"
          (selected)="onSelected($event)"
          [minWidth]="250"
          [minHeight]="200"
          (resized)="onElementChange($event)"
          (moved)="onElementChange($event)"
          (moving)="onElementMoving($event)"
        >
          <div class="card bg-base-100 shadow-md w-full h-full rounded-[8px] bg-card">
            <div class="card-body p-2 h-full flex flex-col">
              <h3 class="card-title">Alertas y Pendientes</h3>

              <div class="flex-1 overflow-auto">
                <div *ngIf="alertsLoading" class="py-4 flex justify-center"><span class="loading loading-spinner"></span></div>

                <ul *ngIf="!alertsLoading && alerts.length > 0" class="space-y-2">
                  <li *ngFor="let a of alerts | slice:0:3" class="flex items-start justify-between">
                    <div class="min-w-0">
                      <div class="font-medium truncate">{{ a.title }}</div>
                      <div class="text-xs text-base-content/60 truncate">{{ a.message }}</div>
                    </div>
                    <div class="ml-3 text-xs">
                      <span *ngIf="!a.read" class="badge badge-warning">Nueva</span>
                    </div>
                  </li>
                </ul>

                <div *ngIf="!alertsLoading && alerts.length === 0" class="text-sm text-base-content/60">No hay alertas recientes.</div>
              </div>

              <div class="mt-2 flex justify-end">
                <a routerLink="/alerts" class="btn btn-sm btn-ghost">Ver todas</a>
              </div>
            </div>
          </div>
        </app-resizable-container>

        <!-- Charts -->
        @if (charts$ | async; as charts) {
          @if (charts.length > 0) {
            @for (c of charts; track c.key) {
              <app-resizable-container
                  [elementId]="'chart-' + c.key"
                  [editMode]="editMode"
                  [initialWidth]="getElementSize('chart-' + c.key).width"
                  [initialHeight]="getElementSize('chart-' + c.key).height"
                  [initialX]="getElementPosition('chart-' + c.key).x"
                  [initialY]="getElementPosition('chart-' + c.key).y"
                  [containerWidth]="containerWidth"
                  [containerHeight]="containerHeight"
                  [position]="elementSizes['chart-' + c.key] || null"
                  [selectedId]="selectedId"
                  (selected)="onSelected($event)"
                  [minWidth]="300"
                  [minHeight]="250"
                  (resized)="onElementChange($event)"
                  (moved)="onElementChange($event)"
                  (moving)="onElementMoving($event)"
                >
                <div class="card shadow-md bg-card rounded-lg w-full h-full">
                  <div class="card-body p-3 h-full overflow-auto">
                    <div class="flex items-center justify-between mb-0">
                      <h3 class="card-title text-base">{{ c.title }}</h3>
                    </div>
                      <div *ngIf="c.key === 'ingresos'" class="w-full mt-0 dashboard-separator" style="border-bottom:1px solid rgba(180,180,190,0.12);"></div>
                    <app-chart-renderer [config]="c"></app-chart-renderer>
                  </div>
                </div>
                </app-resizable-container>
            }
          } @else {
            <div class="alert alert-info">Selecciona módulos (Ventas o Compras) para ver gráficas relevantes.</div>
          }
        } @else {
          <div class="flex items-center justify-center py-8"><span class="loading loading-dots loading-md"></span></div>
        }
        </ng-container>
      </div>
      <!-- Debug drawer -->
      <div *ngIf="showDebug" class="fixed inset-0 z-60 flex items-start justify-center pt-24 bg-black/40">
        <div class="bg-base-100 rounded-lg shadow-lg w-[90%] max-w-4xl p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg">Debug: stored layouts</h3>
            <div>
              <button class="btn btn-sm btn-primary mr-2" (click)="copyAll()">Copiar todo</button>
                <button class="btn btn-sm btn-ghost mr-2" (click)="applySavedLayouts()">Aplicar</button>
                <button class="btn btn-sm btn-accent mr-2" (click)="forceSaveFromDom()">Forzar Guardado</button>
                <button class="btn btn-sm btn-ghost mr-2" (click)="applySavedLayouts()">Aplicar</button>
                <button class="btn btn-sm btn-warning mr-2" (click)="clearSavedLayouts()">Eliminar</button>
              <button class="btn btn-sm btn-error ml-2" (click)="toggleDebug()">Cerrar</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="font-medium mb-1">dashboard-element-layout</div>
              <textarea class="w-full h-64 p-2 text-xs font-mono" readonly [value]="rawElementLayout"></textarea>
            </div>
            <div>
              <div class="font-medium mb-1">dashboard-widget-layout</div>
              <textarea class="w-full h-64 p-2 text-xs font-mono" readonly [value]="rawWidgetLayout"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dashboardRoot', { static: false }) dashboardRoot!: ElementRef<HTMLElement>;
  @ViewChild(DashboardGridComponent, { static: false }) dashboardGridComp?: DashboardGridComponent;
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private alertService = inject(AlertService);
  private chartsService = inject(ChartsService);
  
  currentUser: User | null = null;
  layoutStorageSuffix = ':global';
  isSingleUser = false;
  widgets$!: Observable<DashboardWidget[]>;
  charts$!: Observable<ChartConfig[]>;
  alerts: any[] = [];
  alertsLoading = true;
  editMode = false;
  elementSizes: { [key: string]: { width: number; height: number; x: number; y: number } } = {};
  // Store ratios for responsive scaling
  private elementRatios: { [key: string]: { widthRatio: number; heightRatio: number; xRatio: number; yRatio: number } } = {};
  private savedContainerWidth = 1200;
  private lastKnownContainerWidth?: number | null = null;
  // Grid overlay state
  showGrid = false;
  gridCellSize = 20;
  containerWidth = 1200;
  containerHeight = 900;
  gridHighlight: { x: number; y: number; width: number; height: number } | null = null;
  selectedId: string | null = null;
  layoutApplied = false;
  // Undo history for elementSizes (element-level undo)
  private history: Array<{ elementSizes: { [k: string]: any } }> = [];
  private maxHistory = 50;

  // Key handler bound methods
  private onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private updateSizeBound = () => this.updateContainerSize();
  private resizeObserver?: ResizeObserver | null = null;
  private cdr = inject(ChangeDetectorRef);
  showDebug = false;
  rawElementLayout = '';
  rawWidgetLayout = '';
  // Feature flag to enable/disable dashboard edit mode UI
  allowEdit = true;
  // Simplified save management: no debounce, immediate persist
  private userHasEditedLayout = false; // track if user manually edited to avoid auto-normalization

  ngOnInit(): void {
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      (window as any)['dashboardComponent'] = this;
    }

    // set current user synchronously if available and derive storage suffix
    const cu = this.authService.currentUserValue;
    this.currentUser = cu;
    this.layoutStorageSuffix = cu && cu.tenant && cu.tenant.id ? `:tenant_${cu.tenant.id}` : ':global';
    this.isSingleUser = !!(cu?.tenant?.config && cu?.tenant?.config.employees_count === 1);
    // subscribe to updates
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isSingleUser = !!(user?.tenant?.config && user?.tenant?.config.employees_count === 1);
      this.layoutStorageSuffix = user && user.tenant && user.tenant.id ? `:tenant_${user.tenant.id}` : ':global';
    });
    
    // Load widgets from backend
    this.widgets$ = this.dashboardService.getWidgets();

    // Load charts config based on tenant modules
    this.charts$ = this.chartsService.getCharts();

    // Load recent alerts preview
    this.alertsLoading = true;
    this.alertService.getAlerts({ per_page: 5 }).subscribe({
      next: (res: any) => {
        this.alerts = res.data ?? res;
        this.alertsLoading = false;
      },
      error: () => {
        this.alerts = [];
        this.alertsLoading = false;
      }
    });

    // preload element layout so template renders with positions immediately
    this.loadLayout();
  }

  ngAfterViewInit(): void {
    // initial measurement and respond to window resize (sidebar open/close will trigger resize)
    this.updateContainerSize();
    window.addEventListener('resize', this.updateSizeBound);
    // Observe dashboard root for layout size changes (covers sidebar open/close without window resize)
    // Only measure, never reposition automatically
    try {
      if (this.dashboardRoot && this.dashboardRoot.nativeElement && (window as any).ResizeObserver) {
        this.resizeObserver = new (window as any).ResizeObserver(() => {
          if (!this.editMode) {
            this.updateContainerSize();
          }
        });
        this.resizeObserver.observe(this.dashboardRoot.nativeElement);
      }
    } catch (e) {
      // ignore if ResizeObserver not available
    }
    // ensure loaded ratios are applied now that we measured the container
    setTimeout(() => {
      // create the child tree immediately so DashboardGridComponent exists
      this.layoutApplied = true;
      try { this.cdr.detectChanges(); } catch (e) {}

      // Run deterministic two-pass apply: widgets -> elements
      try {
        this.applyWidgetThenElementLayouts();
      } catch (e) {
        console.warn('ngAfterViewInit: applyWidgetThenElementLayouts failed', e);
      }

      // Retry once after a short delay to handle any late initializations
      setTimeout(() => {
        try { this.applyWidgetThenElementLayouts(); } catch (e) { console.warn('ngAfterViewInit retry failed', e); }
      }, 100);
    }, 0);
  }

  private applyWidgetThenElementLayouts(): void {
    try {
      // Apply widget ratios first
      if (this.dashboardGridComp && typeof (this.dashboardGridComp as any).applyWidgetRatios === 'function') {
        (this.dashboardGridComp as any).applyWidgetRatios(this.containerWidth, this.containerHeight, false);
      }

      try { this.cdr.detectChanges(); } catch (e) {}

      // Apply element ratios
      try { this.applyElementRatios(false); } catch (e) { console.warn('⚠ applyElementRatios failed', e); }

      try { this.inspectSavedVsDom(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('⚠ applyWidgetThenElementLayouts failed', e);
    }
  }



  toggleDebug(): void {
    this.showDebug = !this.showDebug;
    if (this.showDebug) this.loadRawLayouts();
  }

  loadRawLayouts(): void {
    try {
      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
      this.rawElementLayout = localStorage.getItem(eKey) || '';
      this.rawWidgetLayout = localStorage.getItem(wKey) || '';
    } catch (e) {
      this.rawElementLayout = 'error reading localStorage';
      this.rawWidgetLayout = 'error reading localStorage';
    }
  }

  copyAll(): void {
    const combined = `element:${this.rawElementLayout}\n\nwidget:${this.rawWidgetLayout}`;
    try {
      navigator.clipboard.writeText(combined);
      alert('Layout copiado al portapapeles');
    } catch (e) {
      alert('No se pudo copiar');
    }
  }

  applySavedLayouts(): void {
    console.info('📥 applySavedLayouts: reloading from localStorage');
    this.loadLayout();
    try {
      this.layoutApplied = false;
      try { this.cdr.detectChanges(); } catch (e) {}
      setTimeout(() => {
        this.layoutApplied = true;
        try { this.cdr.detectChanges(); } catch (e) {}
        try {
          this.applyWidgetThenElementLayouts();
        } catch (e) {
          console.warn('⚠ applySavedLayouts: applyWidgetThenElementLayouts failed', e);
        }
        this.loadRawLayouts();
        try { this.inspectSavedVsDom(); } catch (e) {}
        alert('Layouts aplicados desde localStorage');
        console.info('✓ applySavedLayouts: done');
      }, 40);
    } catch (e) {
      console.warn('⚠ applySavedLayouts: forced re-render failed', e);
    }
  }

  clearSavedLayouts(): void {
    try {
      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
      localStorage.removeItem(eKey);
      localStorage.removeItem(wKey);
      this.rawElementLayout = '';
      this.rawWidgetLayout = '';
      // reset in-memory sizes/ratios
      this.elementSizes = {};
      (this as any).elementRatios = {};
      try { this.cdr.detectChanges(); } catch (e) {}
      alert('Layouts eliminados del localStorage');
    } catch (e) {
      console.warn('clearSavedLayouts failed', e);
      alert('No se pudo eliminar layouts');
    }
  }

  /**
   * Debug helper: read positions/sizes of DOM resizable containers and persist them.
   * This forces a snapshot of exactly what is on-screen into localStorage.
   */
  forceSaveFromDom(): void {
    try {
      if (!this.dashboardRoot || !this.dashboardRoot.nativeElement) {
        alert('Dashboard root not available');
        return;
      }

      const rootRect = this.dashboardRoot.nativeElement.getBoundingClientRect();
      const nodes = Array.from(this.dashboardRoot.nativeElement.querySelectorAll('[data-element-id]')) as HTMLElement[];
      const newElementSizes: any = {};
      const newWidgetSizes: any = {};

      nodes.forEach(n => {
        const id = n.getAttribute('data-element-id') || '';
        const rect = n.getBoundingClientRect();
        const relX = Math.max(0, Math.round(rect.left - rootRect.left));
        const relY = Math.max(0, Math.round(rect.top - rootRect.top));
        const w = Math.max(40, Math.round(rect.width));
        const h = Math.max(40, Math.round(rect.height));

        newElementSizes[id] = { width: w, height: h, x: relX, y: relY };

        if (id.startsWith('widget-')) {
          const wid = id.replace('widget-', '');
          try { newWidgetSizes[parseInt(wid)] = { width: w, height: h, x: relX, y: relY }; } catch (e) { newWidgetSizes[wid] = { width: w, height: h, x: relX, y: relY }; }
        }
      });

      // persist element layout with ratios
      const ew = this.containerWidth || rootRect.width || 1200;
      const eh = this.containerHeight || rootRect.height || 900;

      const elementRatios: any = {};
      Object.keys(newElementSizes).forEach(k => {
        const el = newElementSizes[k];
        elementRatios[k] = { widthRatio: el.width / ew, heightRatio: el.height / eh, xRatio: el.x / ew, yRatio: el.y / eh };
      });

      const elementPayload = { ratios: elementRatios, sizes: newElementSizes, containerWidth: ew, containerHeight: eh };
      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      localStorage.setItem(eKey, JSON.stringify(elementPayload));

      // persist widget payload as structured object (ratios + sizes)
      const widgetRatios: any = {};
      Object.keys(newWidgetSizes).forEach(k => {
        const el = newWidgetSizes[k];
        widgetRatios[k] = { widthRatio: el.width / ew, heightRatio: el.height / eh, xRatio: el.x / ew, yRatio: el.y / eh };
      });
      const widgetPayload = { ratios: widgetRatios, sizes: newWidgetSizes, containerWidth: ew, containerHeight: eh };
      const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
      localStorage.setItem(wKey, JSON.stringify(widgetPayload));

      // update in-memory and UI
      this.elementSizes = Object.assign({}, this.elementSizes, newElementSizes);
      try { if (this.dashboardGridComp && typeof (this.dashboardGridComp as any).applyWidgetRatios === 'function') { (this.dashboardGridComp as any).applyWidgetRatios(this.containerWidth, this.containerHeight); } } catch (e) {}
      this.userHasEditedLayout = true;
      this.persistElementLayout();
      this.loadRawLayouts();
      alert('Forzado: layouts guardados en localStorage');
    } catch (e) {
      console.warn('forceSaveFromDom failed', e);
      alert('No se pudo forzar guardado');
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.updateSizeBound);
    window.removeEventListener('keydown', this.onKeyDown as any);
    try {
      if (this.resizeObserver && this.dashboardRoot && this.dashboardRoot.nativeElement) {
        this.resizeObserver.unobserve(this.dashboardRoot.nativeElement);
        this.resizeObserver.disconnect();
      }
    } catch (e) {}
  }

  private updateContainerSize(): void {
    try {
      if (this.dashboardRoot && this.dashboardRoot.nativeElement) {
        const rect = this.dashboardRoot.nativeElement.getBoundingClientRect();
        const newWidth = Math.max(100, Math.floor(rect.width));
        const newHeight = Math.max(200, Math.floor(rect.height));
        const widthChanged = Math.abs(newWidth - this.containerWidth) > 5;
        const heightChanged = Math.abs(newHeight - this.containerHeight) > 5;

        const oldWidth = this.containerWidth;

        this.containerWidth = newWidth;
        this.containerHeight = newHeight;

        // If container size changed significantly and we're NOT editing, re-apply stored ratios
        // and recompute positions from ratios so items scale responsively (do not preserve
        // previous absolute positions which would cause visual drift when sidebar toggles).
        if (!this.editMode && (widthChanged || heightChanged)) {
          const hasElementRatios = Object.keys(this.elementRatios || {}).length > 0;

          if (hasElementRatios) {
            try {
              this.applyElementRatios(false);
            } catch (e) {
              console.warn('updateContainerSize: applyElementRatios failed', e);
            }
          } else {
            // No stored ratios: scale absolute elementSizes proportionally to avoid jumpy moves.
            try {
              const scaleX = oldWidth > 0 ? (this.containerWidth / oldWidth) : 1;
              Object.keys(this.elementSizes).forEach(k => {
                const el = this.elementSizes[k];
                if (!el) return;
                const newW = Math.max(40, Math.round(el.width * scaleX));
                const newX = Math.max(0, Math.min(Math.round(el.x * scaleX), Math.max(0, this.containerWidth - newW)));
                this.elementSizes[k] = { width: newW, height: el.height, x: newX, y: el.y };
              });
              try { this.cdr.detectChanges(); } catch (e) {}
            } catch (e) {
              console.warn('updateContainerSize: proportional scale of elementSizes failed', e);
            }
          }

          try {
            if (this.dashboardGridComp && typeof (this.dashboardGridComp as any).applyWidgetRatios === 'function') {
              if (!hasElementRatios && this.lastKnownContainerWidth && this.lastKnownContainerWidth > 0) {
                // scale widgets proportionally when no ratios stored
                try { (this.dashboardGridComp as any).scaleWidgetPositions(this.containerWidth, this.lastKnownContainerWidth, this.containerHeight, this.containerHeight); } catch (e) {}
              } else {
                (this.dashboardGridComp as any).applyWidgetRatios(this.containerWidth, this.containerHeight, false);
              }
            }
          } catch (e) {
            console.warn('updateContainerSize: applyWidgetRatios failed', e);
          }
        }

        this.lastKnownContainerWidth = this.containerWidth;
      }
    } catch (e) {
      console.warn('Could not update container size', e);
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    // show/hide overlay
    this.showGrid = this.editMode;
    // use a finer grid while editing to allow tighter placement
    this.gridCellSize = this.editMode ? 10 : 20;
    if (this.editMode) {
      window.addEventListener('keydown', this.onKeyDown, { passive: false });
      // focus dashboard root for keyboard handling (immediate)
      this.dashboardRoot?.nativeElement?.focus?.();
    } else {
      window.removeEventListener('keydown', this.onKeyDown as any);
    }
    if (!this.editMode) {
      // Save immediately when exiting edit mode
      try {
        console.info('DashboardComponent.toggleEditMode: saving on exit');
        if (this.dashboardGridComp && typeof this.dashboardGridComp.saveLayout === 'function') {
          this.dashboardGridComp.saveLayout();
        }
        this.persistElementLayout();
        this.gridHighlight = null;
        console.info('DashboardComponent.toggleEditMode: save completed');
      } catch (e) {
        console.error('DashboardComponent.toggleEditMode: save failed', e);
      }
    }
  }

  onSelected(id: string): void {
    this.selectedId = id;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Check for undo first (Ctrl/Cmd+Z)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if ((e.ctrlKey || (isMac && e.metaKey)) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.undo();
      return;
    }

    if (!this.editMode || !this.selectedId) return;

    const step = e.shiftKey ? 20 : 5;
    let dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;

    if (dx === 0 && dy === 0) return;

    e.preventDefault();

    // push snapshot before nudge
    this.pushHistory();

    // Find current size/pos
    const cur = this.elementSizes[this.selectedId] ?? { width: this.getElementSize(this.selectedId).width, height: this.getElementSize(this.selectedId).height, x: this.getElementPosition(this.selectedId).x, y: this.getElementPosition(this.selectedId).y };

    const newX = Math.max(0, Math.min(this.containerWidth - cur.width, cur.x + dx));
    const newY = Math.max(0, cur.y + dy);

    this.elementSizes[this.selectedId] = { width: cur.width, height: cur.height, x: newX, y: newY };
    this.gridHighlight = { x: newX, y: newY, width: cur.width, height: cur.height };
    this.userHasEditedLayout = true;
    this.persistElementLayout();
  }

  getElementSize(elementId: string): { width: number; height: number } {
    // Load saved sizes from localStorage
    if (Object.keys(this.elementSizes).length === 0) {
      this.loadLayout();
    }

    const data = this.elementSizes[elementId];
    if (data) {
      return { width: data.width, height: data.height };
    }

    // Return default sizes
    const defaults: { [key: string]: { width: number; height: number } } = {
      'quick-actions': { width: 500, height: 180 },
      'alerts': { width: 500, height: 300 },
    };

    // Charts get default sizes too
    if (elementId.startsWith('chart-')) {
      defaults[elementId] = { width: 720, height: 350 };
    }

    return defaults[elementId] || { width: 400, height: 300 };
  }

  getElementPosition(elementId: string): { x: number; y: number } {
    // Load saved positions from localStorage
    if (Object.keys(this.elementSizes).length === 0) {
      this.loadLayout();
    }

    const data = this.elementSizes[elementId];
    if (data) {
      return { x: data.x, y: data.y };
    }

    // Return default positions (widgets on top, other elements below)
    const baseTop = 220; // offset so widgets occupy the top area
    const defaults: { [key: string]: { x: number; y: number } } = {
      'quick-actions': { x: 0, y: baseTop },
      'alerts': { x: 0, y: baseTop },
    };

    // Charts get positions on the right
    if (elementId.startsWith('chart-')) {
      const chartIndex = elementId === 'chart-ingresos' ? 0 : elementId === 'chart-proveedores' ? 1 : 2;
      // place charts below widgets using baseTop as starting Y
      defaults[elementId] = { x: 550, y: baseTop + chartIndex * 370 };
    }

    return defaults[elementId] || { x: 0, y: 0 };
  }

  getContainerHeight(): number {
    // Calculate minimum container height based on elements (smaller baseline to avoid large gaps)
    let maxBottom = 0;
    Object.values(this.elementSizes).forEach(el => {
      const bottom = el.y + el.height;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    const minHeight = 400;
    return Math.max(minHeight, maxBottom + 100);
  }

  onElementChange(data: ResizeData): void {
    // Save snapshot before applying change for undo
    this.pushHistory();
    
    // Save position/size directly as provided
    this.elementSizes[data.id] = {
      width: Math.round(data.width),
      height: Math.round(data.height),
      x: Math.round(data.x),
      y: Math.round(data.y)
    };

    console.info('✓ Element changed:', data.id, this.elementSizes[data.id]);

    // Mark as edited and persist immediately
    this.gridHighlight = null;
    this.userHasEditedLayout = true;
    this.persistElementLayout();
  }

  onElementMoving(data: ResizeData): void {
    // Show live guide without snapping - user sees exact position
    this.gridHighlight = { 
      x: Math.round(data.x), 
      y: Math.round(data.y), 
      width: Math.round(data.width), 
      height: Math.round(data.height) 
    };
  }

  private pushHistory(): void {
    try {
      const snapshot = JSON.parse(JSON.stringify({ elementSizes: this.elementSizes || {} }));
      this.history.push(snapshot);
      if (this.history.length > this.maxHistory) this.history.shift();
    } catch (e) {
      // ignore
    }
  }

  private undo(): void {
    if (this.history.length === 0) return;
    const snapshot = this.history.pop();
    if (!snapshot) return;
    this.elementSizes = JSON.parse(JSON.stringify(snapshot.elementSizes || {}));
    this.userHasEditedLayout = true;
    this.persistElementLayout();
    this.gridHighlight = null;
  }

  loadLayout(): void {
    const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
    let saved = localStorage.getItem(eKey);
    console.info('📥 Loading element layout from:', eKey);
    // If no tenant-scoped layout exists, try global default
    if (!saved) {
      const globalKey = 'dashboard-element-layout:global';
      const globalSaved = localStorage.getItem(globalKey);
      if (globalSaved) {
        console.info('ℹ No tenant layout found, loading global default from:', globalKey);
        saved = globalSaved;
      }
    }
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.elementRatios = data.ratios || {};
        this.savedContainerWidth = data.containerWidth || 1200;
        
        // Recalculate absolute positions from ratios based on current container size
        if (Object.keys(this.elementRatios).length > 0) {
          Object.keys(this.elementRatios).forEach(k => {
            const ratio = this.elementRatios[k];
            if (!ratio) return;

            const newW = Math.max(40, Math.round(ratio.widthRatio * this.containerWidth));
            const newH = Math.max(40, Math.round(ratio.heightRatio * this.containerHeight));
            const newX = Math.max(0, Math.round(ratio.xRatio * this.containerWidth));
            const newY = Math.max(0, Math.round(ratio.yRatio * this.containerHeight));

            this.elementSizes[k] = { width: newW, height: newH, x: newX, y: newY };
          });
          console.info('✓ Loaded from ratios:', Object.keys(this.elementSizes));
        } else if (data.sizes) {
          this.elementSizes = { ...data.sizes };
          console.info('✓ Loaded from sizes:', Object.keys(this.elementSizes));
        }
        this.userHasEditedLayout = true; // Mark as edited if loaded from storage
      } catch (e) {
        console.error('❌ Error loading element layout:', e);
      }
    } else {
      console.info('ℹ No saved layout found');
    }
  }

  /**
   * Set the current in-memory layout as the global default for all tenants/users.
   * This writes both element and widget layouts to the global storage keys (':global').
   * Can be called from the console: `window.dashboardComponent.setAsGlobalDefault()`
   */
  setAsGlobalDefault(): void {
    try {
      // persist element layout as global
      const globalEKey = 'dashboard-element-layout:global';
      const elementPayload = {
        ratios: this.elementRatios || {},
        sizes: this.elementSizes || {},
        containerWidth: this.containerWidth,
        containerHeight: this.containerHeight,
        timestamp: Date.now()
      };
      localStorage.setItem(globalEKey, JSON.stringify(elementPayload));

      // persist widget layout from child grid if available
      try {
        const globalWKey = 'dashboard-widget-layout:global';
        const child: any = this.dashboardGridComp as any;
        const widgetSizes = child?.widgetSizes || {};
        const widgetRatios = child?.widgetRatios || {};
        const widgetPayload = {
          ratios: widgetRatios,
          sizes: widgetSizes,
          containerWidth: this.containerWidth,
          containerHeight: this.containerHeight,
          timestamp: Date.now()
        };
        localStorage.setItem(globalWKey, JSON.stringify(widgetPayload));
      } catch (e) {
        console.warn('setAsGlobalDefault: could not read child widgetSizes', e);
      }

      alert('Este layout se ha establecido como dashboard predeterminado (global).');
      console.info('✓ setAsGlobalDefault: global defaults saved');
    } catch (e) {
      console.error('❌ setAsGlobalDefault failed', e);
      alert('No se pudo establecer el layout global');
    }
  }

  /**
   * Diagnostic helper: compare saved element IDs in localStorage with DOM nodes
   * that have `data-element-id` and log any missing or unexpected entries.
   */
  inspectSavedVsDom(): void {
    try {
      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      const raw = localStorage.getItem(eKey);
      const saved = raw ? JSON.parse(raw) : null;
      const savedKeys = saved && saved.sizes ? Object.keys(saved.sizes) : (saved && saved.ratios ? Object.keys(saved.ratios) : []);
      const root = this.dashboardRoot && this.dashboardRoot.nativeElement ? this.dashboardRoot.nativeElement : null;
      const domKeys: string[] = [];
      if (root) {
        const nodes = Array.from(root.querySelectorAll('[data-element-id]')) as HTMLElement[];
        nodes.forEach(n => {
          const id = n.getAttribute('data-element-id');
          if (id) domKeys.push(id);
        });
      }

      const missingInDom = savedKeys.filter((k: string) => !domKeys.includes(k));
      const missingInSaved = domKeys.filter(k => !savedKeys.includes(k));
      if (missingInDom.length > 0) console.warn('Saved layout contains IDs not present in DOM:', missingInDom);
      if (missingInSaved.length > 0) console.warn('DOM contains element IDs not present in saved layout:', missingInSaved);
      console.info('inspectSavedVsDom: savedKeys', savedKeys, 'domKeys', domKeys);
    } catch (e) {
      console.warn('inspectSavedVsDom failed', e);
    }
  }

  applyElementRatios(preserveAbsolutePositions: boolean = true): void {
    if (!this.elementRatios || Object.keys(this.elementRatios).length === 0) return;
    try {
      Object.keys(this.elementRatios).forEach(k => {
        const ratio = this.elementRatios[k];
        if (!ratio) return;

        const newW = Math.max(40, Math.round(ratio.widthRatio * this.containerWidth));
        const newH = Math.max(40, Math.round(ratio.heightRatio * this.containerHeight));

        let newX: number;
        let newY: number;

        if (preserveAbsolutePositions) {
          const existing = this.elementSizes[k];
          newX = existing && typeof existing.x === 'number' ? existing.x : Math.round(ratio.xRatio * this.containerWidth);
          newY = existing && typeof existing.y === 'number' ? existing.y : Math.round(ratio.yRatio * this.containerHeight);
        } else {
          newX = Math.round(ratio.xRatio * this.containerWidth);
          newY = Math.round(ratio.yRatio * this.containerHeight);
        }

        // Clamp X within bounds, allow Y to expand
        newX = Math.max(0, Math.min(newX, Math.max(0, this.containerWidth - newW)));
        newY = Math.max(0, newY);

        this.elementSizes[k] = { width: newW, height: newH, x: newX, y: newY };
      });
      try { this.cdr.detectChanges(); } catch (e) {}
    } catch (e) {
      console.warn('❌ applyElementRatios failed', e);
    }
  }

  /**
   * When edit UI is disabled we want a stable, sensible arrangement.
   * Populate `elementSizes` with default positions/sizes so the dashboard
   * renders orderly (widgets on top, other items below).
   */
  applyDefaultLayout(): void {
    try {
      // Arrange dashboard defaults so widgets occupy the top area (grid)
      // and the three main non-widget items are placed below in a two-column layout:
      // - Left column: Alerts (large)
      // - Right column: Quick Actions (top) and Total Ventas chart (below)
      // Sizes are computed relative to the current container width so the default layout
      // adapts to various screen sizes.
      // Base vertical offset for elements under the widgets. Use widget default height
      // plus some padding so the non-widget divs sit clearly below the top widgets.
      const widgetDefaultHeight = 220; // matches DashboardGrid default
      const baseTop = widgetDefaultHeight + 40; // e.g. 260
      const gap = 20;
      const cw = Math.max(900, Math.floor(this.containerWidth || 1200));

      const leftColW = Math.max(320, Math.floor(cw * 0.50));
      const rightColW = Math.max(320, cw - leftColW - gap);

      // Quick Actions (right column, top)
      this.elementSizes['quick-actions'] = {
        width: rightColW,
        height: 180,
        x: leftColW + gap,
        y: baseTop
      };

      // Alerts: place below Quick Actions in the right column so it doesn't overlap
      // the top widgets. Use same column X and stack beneath quick-actions.
      const qa = this.elementSizes['quick-actions'];
      // add extra vertical spacing so alerts clearly sits below quick-actions
      const extraStackGap = 40;
      this.elementSizes['alerts'] = {
        width: rightColW,
        height: 420,
        x: leftColW + gap, // ensure alerts align in right column
        y: qa.y + qa.height + gap + extraStackGap
      };

      // Total Ventas chart (common key `ingresos`) — place under Quick Actions in right column
      // Element id used in template is `chart-${c.key}`; set default for `chart-ingresos` here.
      this.elementSizes['chart-ingresos'] = {
        width: rightColW,
        height: 360,
        x: leftColW + gap,
        y: baseTop + 200
      };

      // Update container height so everything fits comfortably
      const bottom = Math.max(
        this.elementSizes['alerts'].y + this.elementSizes['alerts'].height,
        this.elementSizes['chart-ingresos'].y + this.elementSizes['chart-ingresos'].height
      );
      this.containerHeight = Math.max(this.getContainerHeight(), bottom + 120);

      try { this.cdr.detectChanges(); } catch (e) {}
      console.info('DashboardComponent.applyDefaultLayout: applied defaults', this.elementSizes);

      // Only apply widget defaults and clear persisted layouts if there is no saved
      // element/widget layout for this tenant and the user has not manually edited the layout.
      try {
        const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
        const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
        const hasSavedElements = !!localStorage.getItem(eKey);
        const hasSavedWidgets = !!localStorage.getItem(wKey);

        if (!hasSavedElements && !hasSavedWidgets && !this.userHasEditedLayout) {
          // arrange widgets across the top area in a simple grid so the dashboard looks ordered
          if (this.dashboardGridComp) {
            try {
              const widgets = (this.dashboardGridComp as any).sortedWidgets || [];
              if (widgets && widgets.length > 0) {
                const cols = Math.min(3, Math.max(1, Math.floor((this.containerWidth || 1200) / 420)));
                const gap = 20;
                const defaultW = Math.max(320, Math.floor(((this.containerWidth || 1200) - (cols - 1) * gap) / cols));
                const defaultH = 220;
                const widgetSizes: any = {};
                const widgetRatios: any = {};
                widgets.forEach((w: any, idx: number) => {
                  const col = idx % cols;
                  const row = Math.floor(idx / cols);
                  const x = col * (defaultW + gap);
                  const y = row * (defaultH + gap);
                  widgetSizes[w.id] = { width: defaultW, height: defaultH, x, y };
                  widgetRatios[w.id] = {
                    widthRatio: defaultW / (this.containerWidth || 1200),
                    heightRatio: defaultH / (this.containerHeight || 900),
                    xRatio: x / (this.containerWidth || 1200),
                    yRatio: y / (this.containerHeight || 900)
                  };
                });

                // Apply into child component so template renders accordingly only if child has no saved data
                try {
                  const childWidgetRatios = (this.dashboardGridComp as any).widgetRatios || {};
                  const childWidgetSizes = (this.dashboardGridComp as any).widgetSizes || {};
                  if (Object.keys(childWidgetRatios).length === 0 && Object.keys(childWidgetSizes).length === 0) {
                    (this.dashboardGridComp as any).widgetSizes = Object.assign({}, (this.dashboardGridComp as any).widgetSizes || {}, widgetSizes);
                    (this.dashboardGridComp as any).widgetRatios = Object.assign({}, (this.dashboardGridComp as any).widgetRatios || {}, widgetRatios);
                    if (typeof (this.dashboardGridComp as any).emitLayoutChange === 'function') {
                      (this.dashboardGridComp as any).emitLayoutChange();
                    }
                  }
                } catch (e) {
                  console.warn('applyDefaultLayout: could not assign widgetSizes to grid', e);
                }
              }
            } catch (e) {
              console.warn('applyDefaultLayout: widget placement failed', e);
            }
          }

          // Do not clear persisted layouts because there are none for this tenant; leave storage untouched.
        } else {
          console.info('applyDefaultLayout: existing saved layouts detected or user has edited layout — skipping default widget placement/clear');
        }
      } catch (e) {
        console.warn('applyDefaultLayout: error checking saved layouts', e);
      }

      // Clear persisted layouts for this tenant so the default shows for tenants without overrides
      try {
        const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
        const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
        localStorage.removeItem(eKey);
        localStorage.removeItem(wKey);
        this.rawElementLayout = '';
        this.rawWidgetLayout = '';
        console.info('DashboardComponent.applyDefaultLayout: cleared saved layouts from localStorage');
      } catch (e) {
        console.warn('DashboardComponent.applyDefaultLayout: could not clear localStorage', e);
      }
    } catch (e) {
      console.warn('applyDefaultLayout failed', e);
    }
  }

  /**
   * Persist element layout immediately to localStorage with tenant-scoped key.
   * Calculates and stores both absolute sizes and responsive ratios.
   */
  private persistElementLayout(): void {
    try {
      if (this.containerWidth <= 0 || this.containerHeight <= 0) {
        console.warn('⚠ Cannot persist: invalid container dimensions');
        return;
      }

      // Calculate ratios for responsive scaling
      Object.keys(this.elementSizes).forEach(k => {
        const el = this.elementSizes[k];
        if (!el) return;

        this.elementRatios[k] = {
          widthRatio: el.width / this.containerWidth,
          heightRatio: el.height / this.containerHeight,
          xRatio: el.x / this.containerWidth,
          yRatio: el.y / this.containerHeight
        };
      });

      const layoutData = {
        ratios: this.elementRatios,
        sizes: this.elementSizes,
        containerWidth: this.containerWidth,
        containerHeight: this.containerHeight,
        timestamp: Date.now()
      };

      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      localStorage.setItem(eKey, JSON.stringify(layoutData));
      console.info('💾 Element layout saved:', eKey, Object.keys(this.elementSizes));
    } catch (e) {
      console.error('❌ persistElementLayout failed:', e);
    }
  }

  onLayoutChange(layout: any): void {
    // Mark that the user has manually edited the layout so defaults are no longer applied
    this.userHasEditedLayout = true;
    // Layout change event (we do not persist this to the backend here).
    // DashboardGridComponent.saveLayout() persists widget layout to localStorage.
    console.log('Layout actualizado (transient):', layout);
  }

  /**
   * Public method to reset all layouts - can be called from browser console:
   * window['dashboardComponent'].resetAllLayouts()
   */
  resetAllLayouts(): void {
    console.warn('resetAllLayouts: clearing all saved layouts');
    try {
      const eKey = 'dashboard-element-layout' + (this.layoutStorageSuffix || '');
      const wKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
      localStorage.removeItem(eKey);
      localStorage.removeItem(wKey);
      this.elementSizes = {};
      this.elementRatios = {};
      if (this.dashboardGridComp) {
        (this.dashboardGridComp as any).widgetSizes = {};
        (this.dashboardGridComp as any).widgetRatios = {};
      }
      alert('Layouts eliminados. Recarga la página para ver el layout por defecto.');
      console.info('resetAllLayouts: done - reload page to see defaults');
    } catch (e) {
      console.error('resetAllLayouts failed:', e);
    }
  }
}
