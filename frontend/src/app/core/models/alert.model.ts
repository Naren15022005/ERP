export type AlertLevel = 'info' | 'warning' | 'error' | 'success';

export interface Alert {
  id: number;
  tenant_id?: number | null;
  title: string;
  message?: string | null;
  level: AlertLevel;
  read: boolean;
  data?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}
