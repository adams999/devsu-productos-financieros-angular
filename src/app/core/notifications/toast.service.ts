import { Injectable, signal } from '@angular/core';

export interface ToastNotice {
  readonly id: number;
  readonly kind: 'success' | 'error';
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _notice = signal<ToastNotice | undefined>(undefined);
  private nextId = 0;
  private dismissTimer?: ReturnType<typeof setTimeout>;

  readonly notice = this._notice.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(): void {
    clearTimeout(this.dismissTimer);
    this.dismissTimer = undefined;
    this._notice.set(undefined);
  }

  private show(kind: ToastNotice['kind'], message: string): void {
    this.dismiss();
    const id = ++this.nextId;
    this._notice.set({ id, kind, message });
    if (kind === 'success') {
      this.dismissTimer = setTimeout(() => {
        if (this._notice()?.id === id) this.dismiss();
      }, 5000);
    }
  }
}
