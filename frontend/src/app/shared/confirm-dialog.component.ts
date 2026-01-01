import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmPayload } from '../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-60 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" (click)="onCancel()"></div>
      <div (click)="$event.stopPropagation()" class="bg-neutral-900 border border-neutral-800 rounded-md p-4 z-50 w-full max-w-lg">
        <h3 class="text-lg font-semibold mb-2">{{ payload?.title || 'Confirmar' }}</h3>
        <div class="text-sm text-gray-300 mb-4">{{ payload?.message }}</div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-ghost btn-sm" (click)="onCancel()">{{ payload?.cancelText || 'Cancelar' }}</button>
          <button class="btn btn-primary btn-sm" (click)="onConfirm()">{{ payload?.confirmText || 'Confirmar' }}</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent implements OnDestroy {
  visible = false;
  payload: ConfirmPayload | null = null;
  private resolver: ((v: boolean) => void) | null = null;
  private sub: Subscription;

  constructor(private confirm: ConfirmService) {
    this.sub = this.confirm.prompt$.subscribe(({ payload, resolve }) => {
      this.payload = payload;
      this.resolver = resolve;
      this.visible = true;
    });
  }

  onConfirm() {
    if (this.resolver) this.resolver(true);
    this.close();
  }

  onCancel() {
    if (this.resolver) this.resolver(false);
    this.close();
  }

  private close() {
    this.visible = false;
    this.payload = null;
    this.resolver = null;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
