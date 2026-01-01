import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmPayload {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Simple global confirm service that exposes a stream the dialog component can subscribe to.
 * Call `confirm()` to show a dialog and await the user's decision.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private subject = new Subject<{ payload: ConfirmPayload; resolve: (v: boolean) => void }>();

  /** Observable used by the dialog component to open when a prompt arrives */
  get prompt$(): Observable<{ payload: ConfirmPayload; resolve: (v: boolean) => void }> {
    return this.subject.asObservable();
  }

  confirm(payload: ConfirmPayload): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.subject.next({ payload, resolve });
    });
  }
}
