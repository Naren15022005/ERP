import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { InventoryService } from './inventory.service';

const CACHE_KEY = 'inventory_stock_cache';
const CACHE_TS_KEY = 'inventory_stock_cache_ts';

@Injectable({ providedIn: 'root' })
export class InventoryCacheService {
  private subject = new BehaviorSubject<any[] | null>(null);

  constructor(private svc: InventoryService) {
    // initialize from localStorage synchronously
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) this.subject.next(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }

  // synchronous cached value (may be null)
  getCachedSync(): any[] | null {
    const v = this.subject.getValue();
    if (v !== null) return v;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  // observable for updates
  get cache$(): Observable<any[] | null> {
    return this.subject.asObservable();
  }

  // refresh from API and update cache; returns the observable from service
  refresh(params: any = {}) {
    const obs = this.svc.listStock(params);
    obs.subscribe({
      next: (r) => {
        const data = r?.data || r || [];
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
        } catch (e) {}
        this.subject.next(data);
      },
      error: () => {
        // do not clear cache on error
      }
    });
    return obs;
  }
}
