import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number;
  tenant?: {
    id: number;
    name: string;
    slug: string;
    config?: {
      business_type?: string;
      business_description?: string;
      employees_count?: number;
      size_category?: string;
      modules?: string[];
    };
    widgets?: any[];
  };
  roles?: string[];
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  tenant?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  tenant_name: string;
  business_type?: string;
  business_description?: string;
  employees_count?: number;
  size_category?: string;
  modules?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  public token$ = this.tokenSubject.asObservable();

  constructor() {}

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('token');
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.tokenValue && !!this.currentUserValue;
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
      })
    );
  }

  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).pipe(
      tap(response => {
        this.currentUserSubject.next(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        try {
          const widgets = (response.user as any)?.tenant?.widgets;
          if (widgets && Array.isArray(widgets)) {
            localStorage.setItem('dashboard.widgets', JSON.stringify(widgets));
          }
        } catch (e) {
          // ignore
        }
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Clear tenant modules cache to avoid showing stale menus (e.g. roles/users)
    try {
      localStorage.removeItem('tenant_modules_cache');
    } catch (e) {
      // ignore
    }

    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    try {
      const widgets = (response.user as any)?.tenant?.widgets;
      if (widgets && Array.isArray(widgets)) {
        localStorage.setItem('dashboard.widgets', JSON.stringify(widgets));
      }
    } catch (e) {
      // ignore
    }
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    try { localStorage.removeItem('dashboard.widgets'); } catch (e) {}
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }
}
