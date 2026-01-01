import { Component, Input, Output, EventEmitter, OnInit, OnChanges, AfterViewInit, ViewContainerRef, ComponentRef, Type, ViewChildren, QueryList, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardWidget } from '../../../core/services/dashboard.service';
import { ResizableContainerComponent, ResizeData } from '../resizable-container/resizable-container.component';

// Import all widget components
import { SalesTodayWidgetComponent } from '../widgets/sales-today/sales-today-widget.component';
import { SalesWeekWidgetComponent } from '../widgets/sales-week/sales-week-widget.component';
import { SalesMonthWidgetComponent } from '../widgets/sales-month/sales-month-widget.component';
import { ProductsTotalWidgetComponent } from '../widgets/products-total/products-total-widget.component';
import { ProductsLowStockWidgetComponent } from '../widgets/products-low-stock/products-low-stock-widget.component';
import { PurchasesMonthWidgetComponent } from '../widgets/purchases-month/purchases-month-widget.component';
import { PurchasesPendingWidgetComponent } from '../widgets/purchases-pending/purchases-pending-widget.component';
import { SuppliersTotalWidgetComponent } from '../widgets/suppliers-total/suppliers-total-widget.component';
import { SuppliersTopWidgetComponent } from '../widgets/suppliers-top/suppliers-top-widget.component';
import { CustomersTotalWidgetComponent } from '../widgets/customers-total/customers-total-widget.component';
import { CustomersTopWidgetComponent } from '../widgets/customers-top/customers-top-widget.component';
import { InventoryValueWidgetComponent } from '../widgets/inventory-value/inventory-value-widget.component';
import { InventoryMovementsWidgetComponent } from '../widgets/inventory-movements/inventory-movements-widget.component';

@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  imports: [CommonModule, ResizableContainerComponent],
  template: `
    <div class="absolute inset-0 w-full" [style.height.px]="getContainerHeight()">
      <ng-container *ngFor="let widget of sortedWidgets; let widgetIdx = index; trackBy: trackById">
        <app-resizable-container
          [elementId]="'widget-' + widget.id"
          [editMode]="editMode"
          [initialWidth]="getWidgetSize(widget.id).width"
          [initialHeight]="getWidgetSize(widget.id).height"
          [initialX]="getWidgetPosition(widget.id).x"
          [initialY]="getWidgetPosition(widget.id).y"
          [containerWidth]="containerWidth"
          [containerHeight]="containerHeight"
          [containerPadding]="containerPadding ?? 8"
          [position]="widgetSizes[widget.id] || null"
          [selectedId]="selectedId"
          (selected)="elementSelected.emit($event)"
          [minWidth]="200"
          [minHeight]="140"
          (resized)="onWidgetChange($event)"
          (moved)="onWidgetChange($event)"
        >
          <div class="relative h-full rounded-lg p-4 overflow-hidden shadow-md transition-shadow hover:shadow-lg flex items-start bg-card w-full widget-visual" style="--widget-lum:95%">
            <div class="absolute top-4 right-4 pointer-events-none p-2 rounded-md w-12 h-12 flex items-center justify-center shadow widget-icon" 
                 [style.fontSize.px]="widget.key === 'sales_today' ? 24 : (widget.key === 'products_total' ? 22 : (widget.key === 'products_low_stock' ? 22 : 20))" 
                 [style.background]="'rgba(0,0,0,0.28)'" 
                 [style.border]="'1px solid rgba(255,255,255,0.02)'" 
                 [style.color]="widget.key === 'products_low_stock' ? '#ff2d55' : null" 
                 [class.text-violet-500]="widget.key === 'sales_today'" 
                 [class.text-sky-400]="widget.key === 'products_total'" 
                 [class.text-base-content]="widget.key !== 'sales_today' && widget.key !== 'products_total' && widget.key !== 'products_low_stock'" 
                 [innerHTML]="getIconSvg(widget.key)"></div>
            <ng-container #widgetContainer></ng-container>
          </div>
        </app-resizable-container>
      </ng-container>
    </div>
  `
  ,
  styles: [
    `
    /* Widget visual tuning: unified luminous white for icons and main values */
    .widget-visual {
      --widget-lum: 95%;
    }

    .widget-visual .widget-icon,
    .widget-visual .widget-icon svg {
      color: hsl(0 0% var(--widget-lum)) !important;
      fill: currentColor !important;
    }

    /* Target common large-number classes used in widgets: make them pure white with subtle glow.
       Use ::ng-deep to penetrate child component view encapsulation so widget internals are affected. */
    ::ng-deep .widget-visual .text-3xl,
    ::ng-deep .widget-visual .text-4xl,
    ::ng-deep .widget-visual .stat-value,
    ::ng-deep .widget-visual .stat-value * {
      color: #ffffff !important;
      text-shadow: 0 0 6px rgba(255,255,255,0.35), 0 6px 18px rgba(0,0,0,0.25) !important;
      -webkit-font-smoothing: antialiased;
      will-change: color, text-shadow;
    }

    /* Provide an easy class to slightly adjust luminosity per widget if needed */
    .widget-visual[data-luminosity] {
      /* allow inline override via data-luminosity attribute */
    }
    `
  ]
})
export class DashboardGridComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() layoutStorageSuffix?: string | null = null;
  @Input() widgets: DashboardWidget[] = [];
  @Input() editMode = false;
  @Input() selectedId?: string | null;
  @Output() elementSelected = new EventEmitter<string>();
  @Output() layoutChange = new EventEmitter<any>();
  @Input() containerWidth?: number | null;
  @Input() containerHeight?: number | null;
  @Input() containerPadding?: number | null = 8;
  
  @ViewChildren('widgetContainer', { read: ViewContainerRef })
  private widgetContainers!: QueryList<ViewContainerRef>;

  widgetSizes: { [widgetId: number]: { width: number; height: number; x: number; y: number } } = {};
  // Store ratios for responsive scaling
  private widgetRatios: { [widgetId: number]: { widthRatio: number; heightRatio: number; xRatio: number; yRatio: number } } = {};
  private savedContainerWidth = 1200;
  private lastKnownContainerWidth?: number | null = null;

  private componentMap: { [key: string]: Type<any> } = {
    'SalesTodayWidget': SalesTodayWidgetComponent,
    'SalesWeekWidget': SalesWeekWidgetComponent,
    'SalesMonthWidget': SalesMonthWidgetComponent,
    'ProductsTotalWidget': ProductsTotalWidgetComponent,
    'ProductsLowStockWidget': ProductsLowStockWidgetComponent,
    'PurchasesMonthWidget': PurchasesMonthWidgetComponent,
    'PurchasesPendingWidget': PurchasesPendingWidgetComponent,
    'SuppliersTotalWidget': SuppliersTotalWidgetComponent,
    'SuppliersTopWidget': SuppliersTopWidgetComponent,
    'CustomersTotalWidget': CustomersTotalWidgetComponent,
    'CustomersTopWidget': CustomersTopWidgetComponent,
    'InventoryValueWidget': InventoryValueWidgetComponent,
    'InventoryMovementsWidget': InventoryMovementsWidgetComponent,
  };

  get sortedWidgets(): DashboardWidget[] {
    return [...this.widgets]
      .filter(w => w.is_enabled !== false)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  constructor(private viewContainerRef: ViewContainerRef, private sanitizer: DomSanitizer) {}

  private viewInitialized = false;

  ngOnInit() {
    // nothing here — wait for view children to be ready
    this.loadSavedLayout();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.widgets && !changes.widgets.firstChange) {
      this.loadSavedLayout();
      this.loadWidgets();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.loadWidgets();
  }
 

  trackById(_index: number, item: DashboardWidget): number {
    return item?.id ?? _index;
  }

  private iconMap: { [k: string]: string } = {
    'sales_today': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M23.62 3.058c.51-2.2-3.709-3.519-5.838-2.909c-1.66.52-2.16 1.76-1.7 2.799a2.81 2.81 0 0 0 1.06 3.049a5.11 5.11 0 0 0 5.578-.07a1.93 1.93 0 0 1-.93 1.18c-.402.313-.86.547-1.35.689a.302.302 0 1 0 .08.6a3.5 3.5 0 0 0 2.35-.67a2.31 2.31 0 0 0 .59-2.58a2.36 2.36 0 0 0 .16-2.088m-5.498-1.87a5.7 5.7 0 0 1 3.208.07c2.34.69 2 2.09.22 2.49c-3.148.72-6.107-1.62-3.428-2.56m1.999 4.459a5.2 5.2 0 0 1-2.4-.49a1.61 1.61 0 0 1-.919-1.32a5.7 5.7 0 0 0 6.198.16c-.17 1.25-1.61 1.62-2.92 1.65zm-13.385.18c.87 2.259 4.998 2.559 6.818.86a2.42 2.42 0 0 0 .6-2.69c.51-2.199-3.71-3.518-5.848-2.908c-1.65.52-2.15 1.759-1.69 2.798a3.77 3.77 0 0 0 .12 1.94m6.208.17c-1.25 1-4.938.87-5.548-.75a3 3 0 0 1-.1-.44a5.7 5.7 0 0 0 6.257.13a1.53 1.53 0 0 1-.61 1.06m-1.08-3.769c2.35.69 2 2.09.22 2.5a5.4 5.4 0 0 1-3.638-.47c-2.24-1.35.32-2.94 3.418-2.03M1.718 12.194c.08 0 2.8-.87 2.88-.9a.33.33 0 0 0 0 .5c.26.28-.33 1-.49 1.19c-.3.489-.67.93-1.1 1.31c-.32.21-.33-.12-.44-.18s-.42-.64-.59-.7s-.52.2-.3.53s.44.59.7.929c1.76 3.349 1.91 3.788 2.4 4.258a1.2 1.2 0 0 0 .999.37c1.53-.09 13.864-4.148 15.743-4.998a1 1 0 0 0 .59-.6c.15-.93-4.768-6.137-6.297-6.327c-1-.12-11.496 2.919-14.115 3.998a.35.35 0 0 0 .02.62m16.394 2.35a8.8 8.8 0 0 1 1.769-2.11c.332.335.614.715.84 1.13c-.72.3-1.87.71-2.61.98m-8.107-4.709c.09 0 5.228-1.32 5.668-1.26c.76.11 2.998 2.57 3.558 3.15c-1.53.709-2.159 2.368-1.879 3.078c-.89.32-7.817 2.739-9.396 3.269c-.47-2.22-4.119-2.17-3.719-1.27a.27.27 0 0 0 .11.15s.63.06.87.17c.753.228 1.44.637 2 1.19a6.3 6.3 0 0 1-1.71.38c-.4-.1-.72-.79-2.38-3.72c2.07-.399 3-2.998 1.88-3.708c-.09-.11-.94.11 4.998-1.429"/><path fill="currentColor" d="M9.435 13.324c.43.63 1.25.5 2 .39c1.209-.19 1.279.34.24.69a2.9 2.9 0 0 1-1 .16a.342.342 0 1 0-.07.679c.467.073.944.046 1.4-.08c0 .33.809.91 1.089.74s0-1.06 0-1.14v-.07c.92-.76.27-1.91-.72-2.13a11.6 11.6 0 0 0-2 .11c-.27-.309-.869-.809 1.31-.639a.303.303 0 1 0 .09-.6a6 6 0 0 0-1.17-.16c-.21-.55-.999-.92-1.249-.78s0 .9.14 1.12a1.4 1.4 0 0 0-.36.63c-.13.35.11.75.3 1.08m3.789-3.259a4.26 4.26 0 0 0 3.998 1.13a.34.34 0 1 0 0-.68a14.6 14.6 0 0 1-3.688-1.2c-.33-.2-1.01.33-.31.75"/><path fill="currentColor" d="M3.188 19.661c.437.652.97 1.235 1.58 1.73c1.997 1.109 14.992-4.1 17.142-4.93a.35.35 0 0 0-.24-.65c-1 .37-15.473 5.169-16.443 4.689c-.5-.397-.95-.854-1.34-1.36c-1.06-1.34-2.129-3.898-2.638-3.838a.3.3 0 0 0-.28.38a45 45 0 0 0 2.219 3.978"/><path fill="currentColor" d="M22 18.062c-1.11.4-16.223 5.367-17.343 4.878a8 8 0 0 1-1.41-1.35C2.189 20.33 1.3 18.491.79 17.922c-.23-.26-.65-.12-.57.25c0 .18.45.62.7 1.11c.13.23.23.479.34.719a13.1 13.1 0 0 0 2.279 3.239a1.73 1.73 0 0 0 1.699.74c3.998-.23 13.305-3.84 16.993-5.269a.35.35 0 0 0-.23-.65"/></svg>`,
    'products_total': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M11 22c-.818 0-1.6-.33-3.163-.99C3.946 19.366 2 18.543 2 17.16V7m9 15V11.355M11 22c.34 0 .646-.057 1-.172M20 7v4.5M7.326 9.691L4.405 8.278C2.802 7.502 2 7.114 2 6.5s.802-1.002 2.405-1.778l2.92-1.413C9.13 2.436 10.03 2 11 2s1.871.436 3.674 1.309l2.921 1.413C19.198 5.498 20 5.886 20 6.5s-.802 1.002-2.405 1.778l-2.92 1.413C12.87 10.564 11.97 11 11 11s-1.871-.436-3.674-1.309M5 12l2 1m9-9L6 9"/><path d="M20.132 20.159L22 22m-.793-4.404a3.6 3.6 0 0 1-3.603 3.597A3.6 3.6 0 0 1 14 17.596A3.6 3.6 0 0 1 17.604 14a3.6 3.6 0 0 1 3.603 3.596Z"/></g></svg>`,
    'products_low_stock': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 16h6m-1-6V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14M7.5 4.27l9 5.15"/><path d="M3.29 7L12 12l8.71-5M12 22V12"/></g></svg>`,
  };

  getIconSvg(key: string): SafeHtml {
    const svg = this.iconMap[key] ?? `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getIconRaw(key: string): string {
    return this.iconMap[key] ?? `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z"/></svg>`;
  }

  // Widget size and position methods
  getWidgetSize(widgetId: number): { width: number; height: number } {
    this.loadSavedLayout();
    const data = this.widgetSizes[widgetId];
    // Increase default widget width/height so top widgets are wider and more prominent
    return data ? { width: data.width, height: data.height } : { width: 420, height: 220 };
  }

  getWidgetPosition(widgetId: number): { x: number; y: number } {
    this.loadSavedLayout();
    const data = this.widgetSizes[widgetId];
    if (data) {
      return { x: data.x, y: data.y };
    }

    // Default grid positions
    const widgets = this.sortedWidgets;
    const index = widgets.findIndex(w => w.id === widgetId);
    const col = index % 3;
    const row = Math.floor(index / 3);
    // Use wider spacing to match the increased default widget width and avoid overlap
    const colSpacing = 440; // default width(420) + gap
    const rowSpacing = 260; // default height(220) + gap
    return { x: col * colSpacing, y: row * rowSpacing };
  }

  getContainerHeight(): number {
    let maxBottom = 0;
    Object.values(this.widgetSizes).forEach(w => {
      const bottom = w.y + w.height;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    const minHeight = 300;
    return Math.max(minHeight, maxBottom + 100);
  }

  onWidgetChange(data: ResizeData): void {
    const widgetId = parseInt(data.id.replace('widget-', ''));
    this.widgetSizes[widgetId] = { 
      width: Math.round(data.width), 
      height: Math.round(data.height),
      x: Math.round(data.x),
      y: Math.round(data.y)
    };
    console.info('✓ Widget changed:', widgetId, this.widgetSizes[widgetId]);
    this.saveLayout();
  }

  // Layout persistence
  loadSavedLayout(): void {
    if (Object.keys(this.widgetSizes).length > 0) return;
    
    const storageKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
    const saved = localStorage.getItem(storageKey);
    console.info('📥 Loading widget layout from:', storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.widgetRatios = data.ratios || {};
        this.savedContainerWidth = data.containerWidth || 1200;

        const currentWidth = this.containerWidth ?? 1200;
        const currentHeight = this.containerHeight ?? 900;

        if (Object.keys(this.widgetRatios).length > 0) {
          Object.keys(this.widgetRatios).forEach(k => {
            const widgetId = parseInt(k);
            const ratio = this.widgetRatios[widgetId];
            if (!ratio) return;

            const newW = Math.max(40, Math.round(ratio.widthRatio * currentWidth));
            const newH = Math.max(40, Math.round(ratio.heightRatio * currentHeight));
            const newX = Math.max(0, Math.min(Math.round(ratio.xRatio * currentWidth), currentWidth - newW));
            const newY = Math.max(0, Math.round(ratio.yRatio * currentHeight));

            this.widgetSizes[widgetId] = { width: newW, height: newH, x: newX, y: newY };
          });
          console.info('✓ Loaded widgets from ratios:', Object.keys(this.widgetSizes));
        } else if (data.sizes) {
          this.widgetSizes = data.sizes || data;
          console.info('✓ Loaded widgets from sizes:', Object.keys(this.widgetSizes));
        }

        this.lastKnownContainerWidth = currentWidth;
      } catch (e) {
        console.error('❌ Error loading widget layout:', e);
      }
    } else {
      console.info('ℹ No saved widget layout found');
    }
  }

  saveLayout(): void {
    const currentWidth = this.containerWidth ?? 1200;
    const currentHeight = this.containerHeight ?? 900;
    
    if (currentWidth <= 0 || currentHeight <= 0) {
      console.warn('⚠ Widget save skipped: invalid container dimensions');
      return;
    }

    // Calculate and store ratios for responsive scaling
    Object.keys(this.widgetSizes).forEach(k => {
      const widgetId = parseInt(k);
      const widget = this.widgetSizes[widgetId];
      if (!widget) return;
      
      this.widgetRatios[widgetId] = {
        widthRatio: widget.width / currentWidth,
        heightRatio: widget.height / currentHeight,
        xRatio: widget.x / currentWidth,
        yRatio: widget.y / currentHeight
      };
    });
    
    const layoutData = {
      ratios: this.widgetRatios,
      sizes: this.widgetSizes,
      containerWidth: currentWidth,
      containerHeight: currentHeight,
      timestamp: Date.now()
    };
    
    const storageKey = 'dashboard-widget-layout' + (this.layoutStorageSuffix || '');
    try {
      localStorage.setItem(storageKey, JSON.stringify(layoutData));
      // Also save a global mapping by widget.key so admin global defaults can be mapped to different tenant widget ids
      const globalKeysKey = 'dashboard-widget-layout:global-keys';
      try {
        const existing = localStorage.getItem(globalKeysKey);
        const globalObj: any = existing ? JSON.parse(existing) : { sizes: {} };
        this.sortedWidgets.forEach(w => {
          const s = this.widgetSizes[w.id];
          if (s) {
            globalObj.sizes[w.key] = { x: s.x, y: s.y, width: s.width, height: s.height };
          }
        });
        localStorage.setItem(globalKeysKey, JSON.stringify(globalObj));
      } catch (e) {
        // ignore global-keys write errors
      }

      console.info('💾 Widget layout saved:', storageKey, Object.keys(this.widgetSizes));
      this.emitLayoutChange();
    } catch (e) {
      console.error('Error saving widget layout', e);
    }
  }

  // Public method to re-apply stored ratios to absolute positions when container size changes
  applyWidgetRatios(containerWidth?: number | null, containerHeight?: number | null, preserveAbsolutePositions: boolean = true): void {
    const cw = containerWidth ?? this.containerWidth ?? 1200;
    const ch = containerHeight ?? this.containerHeight ?? 900;
    if (!this.widgetRatios || Object.keys(this.widgetRatios).length === 0) return;
    try {
      Object.keys(this.widgetRatios).forEach(k => {
        const widgetId = parseInt(k);
        const ratio = this.widgetRatios[widgetId];
        if (!ratio) return;

        const newW = Math.max(40, Math.round(ratio.widthRatio * cw));
        const newH = Math.max(40, Math.round(ratio.heightRatio * ch));

        let newX: number;
        let newY: number;

        if (preserveAbsolutePositions) {
          const existing = this.widgetSizes[widgetId];
          newX = existing && typeof existing.x === 'number' ? existing.x : Math.round(ratio.xRatio * cw);
          newY = existing && typeof existing.y === 'number' ? existing.y : Math.round(ratio.yRatio * ch);
        } else {
          // Recompute positions from ratios so widgets scale responsively when container size changes
          newX = Math.round(ratio.xRatio * cw);
          newY = Math.round(ratio.yRatio * ch);
        }

        // Clamp to container
        newX = Math.max(0, Math.min(newX, Math.max(0, cw - newW)));
        newY = Math.max(0, Math.min(newY, Math.max(0, ch - newH)));

        this.widgetSizes[widgetId] = { width: newW, height: newH, x: newX, y: newY };
      });
      this.emitLayoutChange();
    } catch (e) {
      console.warn('applyWidgetRatios failed', e);
    }
  }

  // Scale widget positions/sizes proportionally when no ratios are present.
  // This preserves logical placement while allowing widgets to widen/narrow
  // when the surrounding container (e.g. sidebar toggle) changes width.
  scaleWidgetPositions(newWidth: number, oldWidth: number, newHeight?: number | null, oldHeight?: number | null): void {
    try {
      if (!oldWidth || oldWidth <= 0) return;
      const scaleX = newWidth / oldWidth;
      const scaleY = (oldHeight && oldHeight > 0 && newHeight) ? (newHeight / oldHeight) : 1;
      Object.keys(this.widgetSizes).forEach(k => {
        const widgetId = parseInt(k);
        const w = this.widgetSizes[widgetId];
        if (!w) return;

        const newW = Math.max(40, Math.round(w.width * scaleX));
        const newH = Math.max(40, Math.round(w.height * scaleY));
        const newX = Math.max(0, Math.min(Math.round(w.x * scaleX), Math.max(0, newWidth - newW)));
        const newY = Math.max(0, Math.min(Math.round(w.y * scaleY), Math.max(0, (newHeight ?? (this.containerHeight ?? newH)) - newH)));

        this.widgetSizes[widgetId] = { width: newW, height: newH, x: newX, y: newY };
      });
      this.emitLayoutChange();
    } catch (e) {
      console.warn('scaleWidgetPositions failed', e);
    }
  }

  emitLayoutChange(): void {
    const layout = {
      sizes: this.widgetSizes,
      widgets: this.sortedWidgets.map((w, idx) => ({ id: w.id, position: idx }))
    };
    this.layoutChange.emit(layout);
  }

  private loadWidgets() {
    // Clear any existing dynamic components from the per-widget containers
    if (this.widgetContainers) {
      this.widgetContainers.forEach(vc => vc.clear());
    }

    // Create components into their matching container (keeps grid layout intact)
    const containers = this.widgetContainers ? this.widgetContainers.toArray() : [];
    this.sortedWidgets.forEach((widget, idx) => {
      const componentType = this.componentMap[widget.component];
      const target = containers[idx];
      if (componentType && target) {
        const ref = target.createComponent(componentType);
        if (widget.initial_data) {
          try {
            (ref.instance as any).initialData = widget.initial_data;
            ref.changeDetectorRef?.detectChanges();
          } catch (e) {
            // ignore if component doesn't accept the input
          }
        }

        // icons are rendered by the grid template now; no DOM insertion required
      }
    });
  }
}
