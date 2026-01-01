import { Component, Input, OnInit, OnChanges, AfterViewInit, ViewContainerRef, ComponentRef, Type, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardWidget } from '../../core/services/dashboard.service';

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
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      <ng-container *ngFor="let widget of sortedWidgets; trackBy: trackById">
        <div class="col-span-1 h-full">
          <div class="h-full rounded-lg p-6 overflow-hidden min-h-[160px] shadow-md transition-shadow hover:shadow-lg flex items-start bg-card">
            <ng-container #widgetContainer></ng-container>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardGridComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() widgets: DashboardWidget[] = [];
  @ViewChildren('widgetContainer', { read: ViewContainerRef })
  private widgetContainers!: QueryList<ViewContainerRef>;

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
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    // initial creation once containers are available
    this.loadWidgets();

    // if containers list changes (e.g. widgets updated), reload
    this.widgetContainers.changes.subscribe(() => {
      this.loadWidgets();
    });
  }

  ngOnChanges() {
    if (this.viewInitialized) {
      this.loadWidgets();
    }
  }

  trackById(_index: number, item: DashboardWidget): number {
    return item?.id ?? _index;
  }

  private iconMap: { [k: string]: string } = {
    'sales_today': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-violet-500" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"/><path d="M12 7a1 1 0 011-1h2a1 1 0 011 1v8a1 1 0 01-1 1h-2a1 1 0 01-1-1V7z"/><path d="M7.5 10a1 1 0 011-1h1a1 1 0 011 1v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-5z"/></svg>`,
    'products_total': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.5L10 3l7.06 3.5L10 10 2.94 6.5z"/><path d="M10 11.25l7.06-3.5v4.5L10 15l-7.06-2.75v-4.5L10 11.25z"/></svg>`,
    'products_low_stock': `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l5.454 9.69A1.75 1.75 0 0116.914 15H3.086a1.75 1.75 0 01-1.282-2.211l5.453-9.69zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 9z"/></svg>`,
  };

  getIconSvg(key: string): SafeHtml {
    const svg = this.iconMap[key] ?? `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getIconRaw(key: string): string {
    return this.iconMap[key] ?? `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z"/></svg>`;
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

        // Insert icon inside the created component's DOM (inside its card)
        try {
          const hostEl = (ref.location && (ref.location.nativeElement as HTMLElement)) || null;
          if (hostEl) {
            const cardEl = (hostEl.querySelector && (hostEl.querySelector('.card') as HTMLElement)) || hostEl;
            // ensure the card container is positioned so absolute icon sits inside
            if (cardEl && cardEl.style) {
              if (!cardEl.style.position) {
                cardEl.style.position = 'relative';
              }
              const wrapper = document.createElement('div');
              wrapper.className = 'absolute top-4 right-4 pointer-events-none p-1 rounded-md w-9 h-9 flex items-center justify-center shadow';
              wrapper.style.zIndex = '5';
              wrapper.style.background = 'var(--bg-card)';
              wrapper.innerHTML = this.getIconRaw(widget.key);
              cardEl.appendChild(wrapper);
            }
          }
        } catch (e) {
          // best-effort: ignore DOM insertion failures
        }
      }
    });
  }
}
