import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DailyCloseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/caja/cierre-diario`;

  list(params: any = {}): Observable<any> {
    return this.http.get<any>(this.base, { params });
  }

  show(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }
}
