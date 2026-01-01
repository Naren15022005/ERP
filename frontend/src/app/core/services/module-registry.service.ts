import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';

const CACHE_KEY = 'tenant_modules_cache';

export interface ModuleManifest {
  key: string;
  title: string;
  route: string;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class ModuleRegistryService {
  // Only show mandatory modules initially; other modules will be loaded from backend
  private readonly MANDATORY_MODULES: ModuleManifest[] = [
    { key: 'dashboard', title: 'Dashboard', route: '/dashboard', order: 10 },
    { key: 'roles', title: 'Roles', route: '/roles', order: 20 },
    { key: 'users', title: 'Usuarios', route: '/users', order: 30 },
  ];

  // Start with `null` to indicate "not loaded". When a token exists we will
  // fetch and emit the tenant modules; when no token we emit the mandatory
  // modules so public UI has a minimal menu.
  private modulesSubject = new BehaviorSubject<ModuleManifest[] | null>(null);

  private isFetching = false;

  modules$ = this.modulesSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[ModuleRegistry] token found at startup');

      // Emit cached modules immediately (if any) to avoid UI flicker
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as ModuleManifest[];
          if (Array.isArray(cached) && cached.length) {
            console.log('[ModuleRegistry] emitting cached modules immediately');
            this.modulesSubject.next(cached);
          }
        }
      } catch (e) {
        // ignore cache parse errors
      }

      // Don't block UI waiting for `auth.me()` to complete. Call `fetchRemote()`
      // immediately so the module list can be requested in parallel. If the
      // user data is missing, refresh `me()` in background (with a short
      // timeout) and trigger another fetch when it completes. This prevents a
      // slow `/auth/me` from delaying the initial module load and the app UI.
      this.fetchRemote();

      if (!this.auth.currentUserValue) {
        // run `me()` in background but don't block: apply a timeout and handle
        // failures gracefully by emitting mandatory modules so the UI remains
        // responsive.
        try {
          this.auth.me().subscribe({
            next: () => {
              // After rehydration, attempt one more fetch to pick any tenant
              // specific modules that may now be available.
              this.fetchRemote();
            },
            error: (err) => {
              console.warn('[ModuleRegistry] background auth.me() failed, will keep mandatory modules', err);
              const raw = localStorage.getItem(CACHE_KEY);
              if (!raw) this.modulesSubject.next(this.MANDATORY_MODULES.slice());
            }
          });
        } catch (e) {
          // Defensive: if auth.me() throws synchronously, fall back to mandatory modules
          const raw = localStorage.getItem(CACHE_KEY);
          if (!raw) this.modulesSubject.next(this.MANDATORY_MODULES.slice());
        }
      } else {
        const tenantModulesPresent = !!((this.auth.currentUserValue as any)?.tenant?.config?.modules);
        if (!tenantModulesPresent) {
          // refresh user in background but don't block the primary fetch
          this.auth.me().subscribe({ next: () => this.fetchRemote(), error: () => {/* ignore */} });
        }
      }
    } else {
      console.log('[ModuleRegistry] no token at startup, emitting mandatory modules');
      this.modulesSubject.next(this.MANDATORY_MODULES.slice());
    }

    // Keep listening for future login/logout events
    this.auth.token$.subscribe(t => {
      if (t) {
        this.fetchRemote();
      } else {
        this.modulesSubject.next(this.MANDATORY_MODULES.slice());
      }
    });
  }

  private fetchRemote(): void {
    // Only attempt remote fetch if we have an auth token to avoid 401s
    const token = localStorage.getItem('token');
    if (!token) return;

    // Try to load modules from backend; on error keep the static list
    if (this.isFetching) return;
    this.isFetching = true;

    console.log('[ModuleRegistry] requesting GET tenant/modules');
    this.http.get<ModuleManifest[]>(`${environment.apiUrl}/tenant/modules`).pipe(
      timeout(5000),
      catchError(err => {
        console.error('[ModuleRegistry] tenant/modules fetch error or timeout', err);
        return of(null as any);
      })
    ).subscribe({
      next: (m) => {
        if (!m) {
          // treat as error/timeout: emit mandatory modules if no cache
          const raw = localStorage.getItem(CACHE_KEY);
          if (!raw) this.modulesSubject.next(this.MANDATORY_MODULES.slice());
          this.isFetching = false;
          return;
        }

        console.log('[ModuleRegistry] received modules from backend:', m);
        // Allow tenant-configured modules present on the user payload to patch the
        // backend response when the DB hasn't been updated yet (helps existing
        // tenants that selected modules at registration).
        const tenantKeys: string[] = (this.auth.currentUserValue as any)?.tenant?.config?.modules || [];
        const received = Array.isArray(m) ? m.slice() : [];
        const existingKeys = new Set(received.map(x => x.key));
        for (const k of tenantKeys) {
          if (!existingKeys.has(k)) {
            // best-effort manifest fallback
            const route = k === 'inventory' ? '/inventory/products' : '/' + k;
            received.push({ key: k, title: k.charAt(0).toUpperCase() + k.slice(1), route } as ModuleManifest);
          }
        }
        let sorted = received.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Ensure `inventory` appears immediately after `products` in the sidebar
        // regardless of numeric order values, when both modules are present.
        const prodIdx = sorted.findIndex(s => s.key === 'products');
        const invIdx = sorted.findIndex(s => s.key === 'inventory');
        if (prodIdx !== -1 && invIdx !== -1) {
          // If inventory is not already right after products, move it.
          if (invIdx !== prodIdx + 1) {
            const [inv] = sorted.splice(invIdx, 1);
            // recompute prod index in case removal shifted it
            const newProdIdx = sorted.findIndex(s => s.key === 'products');
            sorted.splice(newProdIdx + 1, 0, inv);
          }
        }
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
        } catch (e) {
          // ignore cache write errors
        }
        this.modulesSubject.next(sorted);
        this.isFetching = false;
      },
      error: (err) => {
        console.error('[ModuleRegistry] unexpected error fetching tenant modules', err);
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) this.modulesSubject.next(this.MANDATORY_MODULES.slice());
        this.isFetching = false;
      }
    });
  }

  // Allow programmatic update (used by admin UI later)
  updateModules(mods: ModuleManifest[]): void {
    this.modulesSubject.next(mods.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }

  saveModules(mods: { module_key: string; enabled: boolean; display_order?: number }[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/tenant/modules`, { modules: mods });
  }
}
