import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgForOf, NgIf } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule, NgForOf, NgIf],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-semibold mb-4">Alertas</h1>

      <div *ngIf="loading" class="flex items-center justify-center py-8">
        <span class="loading loading-spinner"></span>
      </div>

      <ul *ngIf="!loading && alerts.length === 0" class="text-sm text-base-content/60">
        No hay alertas.
      </ul>

      <ul *ngIf="!loading && alerts.length > 0" class="space-y-2">
        <li *ngFor="let a of alerts" class="p-3 border rounded-lg flex items-start justify-between">
          <div>
            <div class="font-medium">{{ a.title }}</div>
            <div class="text-xs text-base-content/60">{{ a.message }}</div>
            <div class="text-xs text-base-content/50 mt-2">{{ timeAgo(a.created_at) }}</div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <button class="btn btn-sm btn-ghost" (click)="markRead(a)">Marcar leída</button>
            <div *ngIf="!a.read" class="badge badge-warning">Nueva</div>
          </div>
        </li>
      </ul>
    </div>
  `
})
export class AlertsListComponent {
  alerts: any[] = [];
  loading = true;

  constructor(private alertService: AlertService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.alertService.getAlerts({ per_page: 50 }).subscribe({
      next: (res: any) => {
        this.alerts = res.data ?? res;
        this.loading = false;
      },
      error: () => {
        this.alerts = [];
        this.loading = false;
      }
    });
  }

  markRead(a: any) {
    if (a.read) return;
    this.alertService.markRead(a.id).subscribe({
      next: () => {
        a.read = true;
        this.alertService.refresh();
      }
    });
  }

  timeAgo(dt: string) {
    try { return formatDistanceToNow(new Date(dt), { addSuffix: true }); } catch { return '' }
  }
}
