import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserFacingError } from '@app/core/errors/user-facing-error';
import { PRODUCT_DELETE_PORT } from '../ports/product-ports';

@Injectable()
export class ProductDeletionComponentStore {
  private readonly products = inject(PRODUCT_DELETE_PORT);
  private readonly _isDeleting = signal(false);
  private readonly _error = signal<string | undefined>(undefined);

  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(undefined);
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (this._isDeleting()) return false;

    this._isDeleting.set(true);
    this._error.set(undefined);
    try {
      await firstValueFrom(this.products.remove(id));
      return true;
    } catch (error: unknown) {
      this._error.set(
        error instanceof UserFacingError ? error.message : 'No se pudo eliminar el producto.',
      );
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }
}
