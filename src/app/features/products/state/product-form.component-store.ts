import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom, Subscription } from 'rxjs';
import { UserFacingError } from '@app/core/errors/user-facing-error';
import { revisionDateFor } from '../models/product-dates';
import { emptyProductFormValue } from '../models/products.models';
import type { Product, ProductFormValue } from '../models/products.models';
import { PRODUCT_FORM_PORT } from '../ports/product-ports';
import { ProductIdAvailability } from './product-id-availability';

@Injectable()
export class ProductFormComponentStore {
  private readonly products = inject(PRODUCT_FORM_PORT);
  private readonly availability = inject(ProductIdAvailability);
  private readonly destroyRef = inject(DestroyRef);
  readonly model = signal<ProductFormValue>(emptyProductFormValue());
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _original = signal<ProductFormValue | undefined>(undefined);
  private readonly _createBaseline = signal<ProductFormValue>(emptyProductFormValue());
  private readonly _error = signal<string | undefined>(undefined);
  private activeLoad?: Subscription;

  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly idVerification = this.availability.result;
  readonly error = this._error.asReadonly();
  readonly hasLoadedProduct = computed(() => this._original() !== undefined);
  readonly hasUnsavedChanges = computed(() => {
    const original = this._original() ?? this._createBaseline();
    const current = this.model();
    return (
      current.id !== original.id ||
      current.name !== original.name ||
      current.description !== original.description ||
      current.logo !== original.logo ||
      current.dateRelease !== original.dateRelease ||
      current.dateRevision !== original.dateRevision
    );
  });

  verifyId(id: string): void {
    this.availability.verify(id);
  }

  setReleaseDate(dateRelease: string): void {
    this.model.update((model) => ({
      ...model,
      dateRelease,
      dateRevision: revisionDateFor(dateRelease),
    }));
  }

  async create(): Promise<boolean> {
    if (this._isSaving()) return false;

    this._isSaving.set(true);
    this._error.set(undefined);
    try {
      await firstValueFrom(this.products.create(this.model()));
      this._createBaseline.set({ ...this.model() });
      return true;
    } catch (error: unknown) {
      this._error.set(
        error instanceof UserFacingError ? error.message : 'No se pudo crear el producto.',
      );
      return false;
    } finally {
      this._isSaving.set(false);
    }
  }

  async update(): Promise<boolean> {
    const original = this._original();
    if (!original || this._isSaving()) return false;

    this._isSaving.set(true);
    this._error.set(undefined);
    try {
      const saved: Product = await firstValueFrom(
        this.products.update({ ...this.model(), id: original.id }),
      );
      this.model.set({ ...saved });
      this._original.set({ ...saved });
      return true;
    } catch (error: unknown) {
      this._error.set(
        error instanceof UserFacingError ? error.message : 'No se pudo actualizar el producto.',
      );
      return false;
    } finally {
      this._isSaving.set(false);
    }
  }

  load(id: string): void {
    this.activeLoad?.unsubscribe();
    this._original.set(undefined);
    this.model.set(emptyProductFormValue());
    this._isLoading.set(true);
    this._error.set(undefined);
    this.activeLoad = this.products
      .get(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (product) => {
          this.model.set({ ...product });
          this._original.set({ ...product });
        },
        error: (error: unknown) =>
          this._error.set(
            error instanceof UserFacingError ? error.message : 'No se pudo cargar el producto.',
          ),
      });
  }

  reset(): void {
    this.activeLoad?.unsubscribe();
    this._error.set(undefined);
    this.availability.reset();
    const original = this._original();
    if (!original) this._createBaseline.set(emptyProductFormValue());
    this.model.set(original ? { ...original } : emptyProductFormValue());
  }
}
