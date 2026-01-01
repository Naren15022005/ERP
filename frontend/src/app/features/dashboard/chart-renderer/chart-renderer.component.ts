import { Component, Input, OnInit, ElementRef, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ChartsService, ChartConfig } from '../../../core/services/charts.service';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexLegend,
  ApexYAxis,
  ApexPlotOptions,
  ApexTheme,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  title?: ApexTitleSubtitle;
  dataLabels?: ApexDataLabels;
  tooltip?: ApexTooltip;
  stroke?: ApexStroke;
  grid?: ApexGrid;
  fill?: ApexFill;
  legend?: ApexLegend;
  yaxis?: ApexYAxis;
  colors?: string[];
  plotOptions?: ApexPlotOptions;
  theme?: ApexTheme;
};

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="w-full h-full">
      <div #chartHost class="w-full h-full" style="box-sizing:border-box; position:relative;">
        <!-- debug overlay removed in production; use console logs when needed -->
        <div *ngIf="loading" class="bg-base-300/20 rounded-md flex items-center justify-center" style="width:100%; height:100%; min-height:190px;">
          <div class="animate-pulse w-full">
            <div class="h-3 bg-base-200/40 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-base-200/40 rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-base-200/40 rounded w-5/6"></div>
          </div>
        </div>

        <apx-chart #apx *ngIf="!loading && chartOptions" [series]="chartOptions.series" [chart]="chartOptions.chart" [xaxis]="chartOptions.xaxis" [dataLabels]="chartOptions.dataLabels" [tooltip]="chartOptions.tooltip" [stroke]="chartOptions.stroke" [grid]="chartOptions.grid" [style.width.%]="100" [style.height.px]="computedHeight" style="display:block;"></apx-chart>

        <div *ngIf="!loading && !chartOptions" class="bg-base-300/10 rounded-md flex items-center justify-center text-sm text-base-content/60" style="width:100%; height:100%; min-height:190px;">
          <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" class="rounded-md" role="img" aria-label="Gráfica vacía">
            <defs>
              <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,255,255,0.06)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.02)" />
              </linearGradient>
            </defs>
            <!-- background subtle -->
            <rect x="0" y="0" width="600" height="160" fill="url(#lg)" />

            <!-- horizontal grid lines -->
            <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
              <line x1="40" y1="20" x2="580" y2="20" stroke-dasharray="3 4" />
              <line x1="40" y1="50" x2="580" y2="50" stroke-dasharray="3 4" />
              <line x1="40" y1="80" x2="580" y2="80" stroke-dasharray="3 4" />
              <line x1="40" y1="110" x2="580" y2="110" stroke-dasharray="3 4" />
            </g>

            <!-- y axis -->
            <line x1="40" y1="10" x2="40" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
            <!-- x axis -->
            <line x1="40" y1="130" x2="580" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

            <!-- faint example sparkline to indicate structure -->
            <polyline points="40,110 120,90 200,70 280,80 360,60 440,72 520,50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

            <!-- small area under line -->
            <path d="M40 110 L120 90 L200 70 L280 80 L360 60 L440 72 L520 50 L520 130 L40 130 Z" fill="rgba(255,255,255,0.02)" />

            <!-- x-axis label placeholders -->
            <g fill="rgba(255,255,255,0.28)" font-size="11" text-anchor="middle">
              <text x="100" y="148">Ene</text>
              <text x="220" y="148">Mar</text>
              <text x="340" y="148">May</text>
              <text x="460" y="148">Jul</text>
            </g>

            <!-- small message centered -->
            <text x="300" y="80" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="12">No hay datos suficientes para graficar</text>
          </svg>
        </div>

        <div *ngIf="miniOptions" style="position:absolute; bottom:12px; right:12px; width:66px; height:28px; opacity:0.95; z-index:40; pointer-events:none;">
          <apx-chart [series]="miniOptions.series" [chart]="miniOptions.chart" [colors]="miniOptions.colors" [stroke]="miniOptions.stroke" style="width:66px;height:28px"></apx-chart>
        </div>
      </div>
    </div>
  `
})
export class ChartRendererComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config!: ChartConfig;

  @ViewChild('apx') apxChart?: ChartComponent;

  loading = true;
  chartOptions: ChartOptions | null = null;
  miniOptions: ChartOptions | null = null;
  private observer?: IntersectionObserver;
  private hasLoaded = false;
  // responsive sizing
  containerWidth?: number | null = undefined;
  containerHeight?: number | null = undefined;
  computedHeight = 190;
  private resizeObserver?: ResizeObserver;

  constructor(private chartsService: ChartsService, private el: ElementRef) {}

  ngOnInit(): void {
    // If initial data present (embedded in user payload), render immediately
    this.loading = true;
    const init = (this.config as any)?.initial_data;
    if (init) {
      this.setChartOptions(this.buildOptions(init));
      this.loading = false;
      this.hasLoaded = true;
    }
  }

  ngAfterViewInit(): void {
    // set up resize observer for responsive sizing
    try {
      const host = (this.el.nativeElement as HTMLElement).querySelector('#chartHost') as HTMLElement | null;
      const measureHost = (h: HTMLElement | null) => {
        if (!h) return;
        // try several strategies to get a reliable size
        let w = Math.round(h.clientWidth || 0);
        let hh = Math.round(h.clientHeight || 0);
        // prefer contentRect if available
        try {
          const bb = h.getBoundingClientRect();
          if (bb && bb.width) w = Math.round(bb.width);
          if (bb && bb.height) hh = Math.round(bb.height);
        } catch (e) {}
        this.containerWidth = w;
        this.containerHeight = hh || 190;
        console.info('ChartRenderer: measured host', { w: this.containerWidth, h: this.containerHeight });
        this.applyContainerSize();
      };

      if (host && 'ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            // sometimes contentRect can be zero if element not yet laid out, fallback to measuring
            if (cr && (cr.width || cr.height)) {
              this.containerWidth = Math.round(cr.width);
              this.containerHeight = Math.round(cr.height || 190);
            } else {
              // fallback
              measureHost(host);
              continue;
            }
            console.info('ChartRenderer: container size (RO)', { width: this.containerWidth, height: this.containerHeight });
            this.applyContainerSize();
            console.info('ChartRenderer: computed chart height', this.computedHeight);
          }
        });
        this.resizeObserver.observe(host);
        // initial measurement after next frame in case RO hasn't fired yet
        requestAnimationFrame(() => measureHost(host));
      } else if (host) {
        // fallback set initial sizes
        measureHost(host);
      }
    } catch (e) {
      // ignore
    }

    if (!('IntersectionObserver' in window)) {
      // fallback: load immediately
      this.loadData();
      return;
    }

    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && !this.hasLoaded) {
          this.hasLoaded = true;
          this.loadData();
          if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
          }
        }
      }
    }, { rootMargin: '200px' });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  private loadData(): void {
    if (!this.config) {
      this.loading = false;
      return;
    }
    // If initial data was provided by aggregated endpoint, use it immediately
    if ((this.config as any).initial_data) {
      const data = (this.config as any).initial_data;
      this.chartOptions = this.buildOptions(data);
      this.loading = false;
      return;
    }

    // Request remote data; if none and in dev, use a lightweight mock so UI feels alive
    this.chartsService.getChartData(this.config.endpoint).subscribe({
      next: (data) => {
        const built = this.buildOptions(data);
        if (built) {
          this.setChartOptions(built);
          this.applyContainerSize();
        } else if (!environment.production) {
          // provide a small mock series for dev to make dashboard look alive
          this.setChartOptions(this.buildMockOptions());
          this.applyContainerSize();
        } else {
          this.setChartOptions(null);
        }
        this.loading = false;
      },
      error: () => {
        if (!environment.production) {
          this.setChartOptions(this.buildMockOptions());
          this.applyContainerSize();
        } else {
          this.setChartOptions(null);
        }
        this.loading = false;
      }
    });
  }

  private buildMockOptions(): ChartOptions {
    const categories = ['Ene','Feb','Mar','Abr','May','Jun'];
    const values = [120, 150, 90, 180, 130, 170];
    return {
      series: [{ name: this.config?.title || 'Demo', data: values }],
      chart: { type: 'area', height: 190, toolbar: { show: false } },
      colors: ['#5AA7FF'],
      xaxis: { categories },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.2, opacityFrom: 0.6, opacityTo: 0.1, stops: [0, 90, 100] } },
      grid: { strokeDashArray: 3 },
    };
  }

  private setChartOptions(opt: ChartOptions | null) {
    this.chartOptions = opt;
    this.miniOptions = opt ? this.buildMiniOptions(opt) : null;
    this.applyContainerSize();
  }

  private applyContainerSize() {
    const chartDefHeight = (this.chartOptions?.chart?.height as number) ?? 190;
    // Prefer measured container height when available; otherwise fall back to chart default
    let h = (this.containerHeight && this.containerHeight > 0) ? this.containerHeight : chartDefHeight;
    // Ensure a reasonable minimum height so charts have space to draw
    let minH = 190;
    // If the container is very wide, increase minimum to preserve aspect ratio
    if (this.containerWidth && this.containerWidth > 900) {
      minH = Math.max(minH, Math.round(this.containerWidth * 0.25));
    }
    this.computedHeight = Math.max(minH, Math.round(h));
    if (this.chartOptions) {
      // Prefer numeric width when we have a measured host width; fallback to percentage
      const widthVal: any = (this.containerWidth && this.containerWidth > 0) ? this.containerWidth : '100%';
      this.chartOptions = {
        ...this.chartOptions,
        chart: { ...(this.chartOptions.chart || {}), height: this.computedHeight, width: widthVal }
      } as ChartOptions;
      if (this.miniOptions) {
        this.miniOptions = { ...this.miniOptions, chart: { ...this.miniOptions.chart, height: Math.min(40, Math.floor(this.computedHeight / 4)) } } as ChartOptions;
      }

      // Try to force ApexCharts to resize/re-render using component API. If unavailable, dispatch window resize.
      try {
        requestAnimationFrame(() => {
          try {
            if (this.apxChart && (this.apxChart as any).updateOptions) {
              // update only chart dimensions for a lightweight redraw
              (this.apxChart as any).updateOptions({ chart: { height: this.computedHeight, width: widthVal } }, true, true);
            }
            // Some wrappers expose render()
            if (this.apxChart && (this.apxChart as any).render) {
              try { (this.apxChart as any).render(); } catch (e) {}
            }
          } catch (e) {
            // ignore
          }
          try { window.dispatchEvent(new Event('resize')); } catch (e) {}
        });
      } catch (e) {}
    }
  }

  private buildMiniOptions(orig: ChartOptions): ChartOptions {
    return {
      series: orig.series,
      chart: { ...(orig.chart || {}), height: 40, toolbar: { show: false }, sparkline: { enabled: true } },
      colors: orig.colors ?? ['#5AA7FF'],
      stroke: { ...(orig.stroke || {}), width: 2, curve: (orig.stroke && (orig.stroke as any).curve) ? (orig.stroke as any).curve : 'smooth' },
    } as ChartOptions;
  }

  private buildOptions(data: any): ChartOptions | null {
    // Adapters for common endpoints with dedup + aesthetics
    try {
      const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n);
      const limitTop = (pairs: { key: string; sum: number }[], n = 8) => pairs
        .sort((a, b) => b.sum - a.sum)
        .slice(0, n);

      const aggregate = (rows: any[], keySel: (r: any) => string, valSel: (r: any) => number) => {
        const m = new Map<string, number>();
        for (const r of rows) {
          const k = keySel(r) || '';
          const v = valSel(r) || 0;
          m.set(k, (m.get(k) ?? 0) + v);
        }
        return [...m.entries()].map(([key, sum]) => ({ key, sum }));
      };

      if (this.config.key === 'ingresos') {
        const rows = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        const pairs = aggregate(rows,
          (r: any) => (r.period ?? r.label ?? '').toString(),
          (r: any) => Number(r.total ?? r.value ?? 0)
        );
        // Sort YYYY-MM ascending when applicable
        const isYYYYMM = (s: string) => /^\d{4}-\d{2}$/.test(s);
        const sorted = [...pairs].sort((a, b) => {
          if (isYYYYMM(a.key) && isYYYYMM(b.key)) return a.key.localeCompare(b.key);
          return 0;
        });
        const categories = sorted.map(p => p.key);
        const values = sorted.map(p => p.sum);
        // If there's no meaningful data, show empty-state instead of an empty chart
        if (values.length === 0 || values.every(v => Number(v) === 0)) return null;
        return {
          series: [{ name: this.config?.title ?? 'Total Ventas', data: values }],
          chart: { type: 'area', height: 180, toolbar: { show: false }, background: 'transparent' },
          colors: ['#5AA7FF'],
          xaxis: { categories, labels: { rotate: -15, style: { colors: 'rgba(255,255,255,0.6)', fontSize: '12px' } } },
          yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.5)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          legend: { show: false },
          dataLabels: { enabled: false },
          stroke: { curve: 'smooth', width: 2 },
          fill: { type: 'gradient', gradient: { shadeIntensity: 0.2, opacityFrom: 0.55, opacityTo: 0.06, stops: [0, 90, 100] } },
          grid: { strokeDashArray: 2, borderColor: 'rgba(255,255,255,0.03)', yaxis: { lines: { show: true } } },
          tooltip: { y: { formatter: (val) => formatNumber(Number(val)) } },
        };
      }

      if (this.config.key === 'proveedores') {
        const rows = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        const pairs = aggregate(rows,
          (r: any) => (r.name ?? r.title ?? r.company ?? '').toString(),
          (r: any) => Number(r.count ?? r.total ?? 1)
        );
        const top = limitTop(pairs, 8);
        const categories = top.map(p => p.key);
        const values = top.map(p => p.sum);
        if (values.length === 0 || values.every(v => Number(v) === 0)) return null;
        return {
          series: [{ name: 'Proveedores', data: values }],
          chart: { type: 'bar', height: 170, toolbar: { show: false }, background: 'transparent' },
          colors: ['#5AA7FF', '#6AD1E3', '#9B8AFB', '#F79C4B', '#7BD389', '#F76D6D', '#B8C1CF', '#FFCF56'],
          xaxis: { categories, labels: { rotate: -20, trim: true, style: { colors: 'rgba(255,255,255,0.6)', fontSize: '12px' } } },
          yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.5)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          legend: { show: false },
          dataLabels: { enabled: false },
          grid: { strokeDashArray: 2, borderColor: 'rgba(255,255,255,0.03)' },
          tooltip: { y: { formatter: (val) => formatNumber(Number(val)) } },
          plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
        };
      }

      if (this.config.key === 'productos') {
        const rows = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        const pairs = aggregate(rows,
          (r: any) => (r.name ?? r.title ?? r.sku ?? '').toString(),
          (r: any) => Number(r.stock ?? r.quantity ?? r.count ?? 0)
        );
        const top = limitTop(pairs, 8);
        const categories = top.map(p => p.key);
        const values = top.map(p => p.sum);
        if (values.length === 0 || values.every(v => Number(v) === 0)) return null;
        return {
          series: [{ name: 'Productos', data: values }],
          chart: { type: 'bar', height: 170, toolbar: { show: false }, background: 'transparent' },
          colors: ['#9B8AFB'],
          xaxis: { categories, labels: { rotate: -20, trim: true, style: { colors: 'rgba(255,255,255,0.6)', fontSize: '12px' } } },
          yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.5)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          legend: { show: false },
          dataLabels: { enabled: false },
          grid: { strokeDashArray: 2, borderColor: 'rgba(255,255,255,0.03)' },
          tooltip: { y: { formatter: (val) => formatNumber(Number(val)) } },
          plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
        };
      }

      // Fallback: try to build from simple array (dedup by `label`/`name`)
      if (Array.isArray(data) && data.length > 0) {
        const pairs = aggregate(data,
          (d: any) => (d.label ?? d.name ?? '').toString(),
          (d: any) => Number(d.value ?? d.total ?? d.count ?? 0)
        );
        const top = limitTop(pairs, 8);
        const categories = top.map(p => p.key);
        const values = top.map(p => p.sum);
        return {
          series: [{ name: this.config.title, data: values }],
          chart: { type: 'bar', height: 190, toolbar: { show: false } },
          xaxis: { categories },
          dataLabels: { enabled: false },
          grid: { strokeDashArray: 3 },
        };
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}
