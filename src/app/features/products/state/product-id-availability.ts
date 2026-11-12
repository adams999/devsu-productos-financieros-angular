import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { isValidProductIdCandidate } from '../models/product-validation';
import type { IdVerification } from '../models/product-validation';
import { PRODUCT_ID_VERIFIER } from '../ports/product-ports';

@Injectable()
export class ProductIdAvailability {
  private readonly verifier = inject(PRODUCT_ID_VERIFIER);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _result = signal<IdVerification>({ id: '', status: 'idle' });
  private activeRequest?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  readonly result = this._result.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
  }

  verify(id: string): void {
    this.cancel();
    if (!isValidProductIdCandidate(id)) {
      this._result.set({ id, status: 'idle' });
      return;
    }

    this._result.set({ id, status: 'pending' });
    this.timer = setTimeout(() => {
      this.activeRequest = this.verifier
        .isIdTaken(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (taken) => this._result.set({ id, status: taken ? 'taken' : 'available' }),
          error: () => this._result.set({ id, status: 'error' }),
        });
    }, 300);
  }

  reset(): void {
    this.cancel();
    this._result.set({ id: '', status: 'idle' });
  }

  private cancel(): void {
    if (this.timer) clearTimeout(this.timer);
    this.activeRequest?.unsubscribe();
    this.timer = undefined;
    this.activeRequest = undefined;
  }
}
