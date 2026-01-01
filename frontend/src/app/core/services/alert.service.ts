import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Alert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private countSubject = new BehaviorSubject<number>(0);
  public count$ = this.countSubject.asObservable();

  constructor() {
    // Initialize from current user (if backend provides alerts count on auth)
    const initial = (this.auth.currentUserValue as any)?.tenant?.alerts_count || (this.auth.currentUserValue as any)?.tenant?.alerts?.length || 0;
    this.countSubject.next(initial || 0);

    // Keep it in sync with user updates
    this.auth.currentUser$.subscribe(user => {
      const v = (user as any)?.tenant?.alerts_count || (user as any)?.tenant?.alerts?.length || 0;
      this.countSubject.next(v || 0);
    });

    // Poll backend for alerts count as a fallback (every 60s)
    interval(60000).subscribe(() => this.refresh());
  }

  fetchCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${environment.apiUrl}/alerts/count`);
  }

  // Fetch paginated alerts list
  getAlerts(params: { page?: number; per_page?: number } = {}): Observable<{ data: Alert[]; current_page?: number; last_page?: number }> {
    const qp: any = {};
    if (params.page) qp.page = params.page;
    if (params.per_page) qp.per_page = params.per_page;
    return this.http.get<{ data: Alert[]; current_page?: number; last_page?: number }>(`${environment.apiUrl}/alerts`, { params: qp });
  }

  // Mark an alert as read
  markRead(alertId: number): Observable<Alert> {
    return this.http.post<Alert>(`${environment.apiUrl}/alerts/${alertId}/read`, {});
  }

  // Convenience method to refresh and update internal state
  refresh(): void {
    this.http.get<{ count: number }>(`${environment.apiUrl}/alerts/count`).subscribe({
      next: r => this.countSubject.next(r?.count || 0),
      error: () => {}
    });
  }
}
