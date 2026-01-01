import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  list(params: any = {}): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/products`, { params });
  }

  show(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/products/${id}`);
  }

  create(payload: any): Observable<any> {
    // Debug: log payload details so we can see what the client is sending
    try {
      console.debug('ProductService.create called with payload', payload);
      if (payload instanceof FormData) {
        try {
          Array.from((payload as any).entries()).forEach((e: any) => console.debug('ProductService.create FormData entry', e[0], e[1]));
        } catch (e) { /* ignore iteration errors */ }
      }
    } catch (e) { console.debug('ProductService.create debug error', e); }
    // Accept either JSON payload or FormData (multipart) — HttpClient handles headers automatically
    return this.http.post<any>(`${environment.apiUrl}/products`, payload);
  }

  uploadImage(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<any>(`${environment.apiUrl}/uploads/images`, fd);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/products/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/products/${id}`);
  }
}
