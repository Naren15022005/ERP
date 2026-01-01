import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  sku?: string;
  name: string;
  price?: number;
  category_id?: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/dev/inventory`;
  constructor(private http: HttpClient) {}

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  createCategory(payload: Partial<Category>) {
    return this.http.post<Category>(`${this.base}/categories`, payload);
  }

  updateCategory(id: number, payload: Partial<Category>) {
    return this.http.put<Category>(`${this.base}/categories/${id}`, payload);
  }

  deleteCategory(id: number) {
    return this.http.delete(`${this.base}/categories/${id}`);
  }

  listProducts(params: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/products`, { params });
  }

  listStock(params: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/stock`, { params });
  }


  getKardex(params: any = {}) {
    // Use the production API route; in development you can call /api/debug/kardex if needed
    return this.http.get<any>(`/api/kardex`, { params });
  }

  getProduct(id: number) {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }

  createProduct(payload: Partial<Product>) {
    return this.http.post<Product>(`${this.base}/products`, payload);
  }

  updateProduct(id: number, payload: Partial<Product>) {
    return this.http.put<Product>(`${this.base}/products/${id}`, payload);
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.base}/products/${id}`);
  }
}
