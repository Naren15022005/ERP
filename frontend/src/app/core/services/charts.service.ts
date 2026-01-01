import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChartConfig {
  key: 'ingresos' | 'proveedores' | 'productos' | string;
  title: string;
  endpoint?: string;
  priority?: number;
  initial_data?: any;
}

export interface ChartsResponse {
  charts: ChartConfig[];
}

@Injectable({ providedIn: 'root' })
export class ChartsService {
  private baseUrl = `${environment.apiUrl}/dashboard`;
  private _cache = new Map<string, any>();

  constructor(private http: HttpClient) {}

  getCharts(): Observable<ChartConfig[]> {
    // If current user payload already contains pre-fetched charts, return them immediately
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const u = JSON.parse(raw) as any;
        const charts = u?.tenant?.charts;
        if (Array.isArray(charts) && charts.length > 0) {
          const normalized = (charts as ChartConfig[]).map(c => c.key === 'ingresos' ? { ...c, title: 'Total Ventas' } : c);
          return new Observable(sub => { sub.next(normalized); sub.complete(); });
        }
      }
    } catch (e) {
      // ignore
    }

    // Fallback: request aggregated endpoint which returns charts + initial data
    return this.http.get<any>(`${this.baseUrl}/charts/data`).pipe(
      map(res => {
        const raw: ChartConfig[] = (res?.charts || []).map((c: any) => ({ ...c, initial_data: res?.data?.[c.key] }));
        // Deduplicate by `key`, keep the one with lowest `priority` (1 = highest)
        const byKey = new Map<string, ChartConfig>();
        for (const c of raw) {
          const k = c.key || '__unknown__';
          const existing = byKey.get(k);
          if (!existing) { byKey.set(k, c); continue; }
          const pNew = Number(c.priority ?? 999);
          const pExist = Number(existing.priority ?? 999);
          if (pNew < pExist) byKey.set(k, c);
        }
        const charts = Array.from(byKey.values()).map(c => {
          // Normalize titles for clarity in the dashboard UI
          if (c.key === 'ingresos') {
            return { ...c, title: 'Total Ventas' };
          }
          return c;
        });
        return charts;
      })
    );
  }

  /**
   * Fetch raw data for a chart endpoint.
   * If `endpoint` is absolute or starts with `/`, call it directly; otherwise prepend API base.
   */
  getChartData(endpoint?: string): Observable<any> {
    if (!endpoint) return this.http.get(`${environment.apiUrl}/`); // fallback
    const url = endpoint.startsWith('/') ? `${endpoint}` : (endpoint.startsWith('http') ? endpoint : `${environment.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);

    // Return cached response when available
    if (this._cache.has(url)) {
      return new Observable(subscriber => {
        subscriber.next(this._cache.get(url));
        subscriber.complete();
      });
    }

    return new Observable(subscriber => {
      this.http.get(url).subscribe({
        next: (res) => {
          try { this._cache.set(url, res); } catch (e) {}
          subscriber.next(res);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err)
      });
    });
  }
}
