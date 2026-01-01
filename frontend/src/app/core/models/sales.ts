export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id?: number;
  product_name?: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface Payment {
  id?: number;
  sale_id?: number;
  method?: string;
  amount: number;
  reference?: string;
}

export interface Sale {
  id?: number;
  tenant_id?: number;
  created_at?: string;
  updated_at?: string;
  customer_id?: number | null;
  customer_name?: string | null;
  status?: string;
  total: number;
  items?: SaleItem[];
  payments?: Payment[];
}
