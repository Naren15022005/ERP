import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface DashboardWidget {
  id: number;
  key: string;
  name: string;
  module: string;
  description: string;
  component: string;
  min_plan: 'free' | 'basic' | 'pro';
  is_active: boolean;
  metadata: any;
  position?: number;
  is_enabled?: boolean;
  is_locked?: boolean;
  initial_data?: any;
}

export interface UpdateWidgetsRequest {
  widgets: Array<{
    widget_id: number;
    position: number;
    is_enabled: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.apiUrl}/dashboard`;

  private auth = inject(AuthService);

  constructor(private http: HttpClient) {}

  /**
   * Get enabled widgets for the authenticated tenant
   */
  getWidgets(): Observable<DashboardWidget[]> {
    // If we have a cached copy of widgets (last known) return them immediately
    try {
      const cached = localStorage.getItem('dashboard.widgets');
      if (cached) {
        const parsed = JSON.parse(cached) as DashboardWidget[];
        // kick off a background refresh to update widgets when possible
        try { this.auth.me().subscribe({ next: () => {}, error: () => {} }); } catch (e) {}
        return of(parsed);
      }

    } catch (e) {
      // ignore parse errors
    }
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const user = JSON.parse(raw) as any;
        if (user?.tenant?.widgets && Array.isArray(user.tenant.widgets)) {
          return of(user.tenant.widgets as DashboardWidget[]);
        }
      }
    } catch (e) {
      // ignore parse errors and fallthrough to HTTP
    }
    // If currentUser in memory has widgets, return them
    const cu = this.auth.currentUserValue;
    if (cu?.tenant?.widgets && Array.isArray(cu.tenant.widgets)) {
      return of(cu.tenant.widgets as DashboardWidget[]);
    }

    // Otherwise, trigger a refresh (me()) and use widgets if returned; fallback to HTTP
    return this.auth.me().pipe(
      switchMap(() => {
        const refreshed = this.auth.currentUserValue;
        if (refreshed?.tenant?.widgets && Array.isArray(refreshed.tenant.widgets)) {
          try { localStorage.setItem('dashboard.widgets', JSON.stringify(refreshed.tenant.widgets)); } catch (e) {}
          return of(refreshed.tenant.widgets as DashboardWidget[]);
        }
        return this.http.get<DashboardWidget[]>(`${this.baseUrl}/widgets`).pipe(
          // persist server-provided widgets for instant startup next time
          tap(w => {
            try { localStorage.setItem('dashboard.widgets', JSON.stringify(w)); } catch (e) {}
          })
        );
      })
    );
  }

  /**
   * Get all available widgets (including locked ones)
   */
  getAvailableWidgets(): Observable<DashboardWidget[]> {
    return this.http.get<DashboardWidget[]>(`${this.baseUrl}/widgets/available`);
  }

  /**
   * Update tenant widget configuration
   */
  updateWidgets(request: UpdateWidgetsRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/widgets`, request);
  }
}
