import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);

  list(params: any = {}): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/sales`, { params });
  }

  show(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/sales/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/sales`, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/sales/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/sales/${id}`);
  }
}
