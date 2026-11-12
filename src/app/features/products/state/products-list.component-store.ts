import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { UserFacingError } from '@app/core/errors/user-facing-error';
import { PRODUCT_LIST_PORT } from '../ports/product-ports';
import {
  clampPageIndex,
  filterProducts,
  indexProducts,
  pageCountFor,
  visiblePage,
} from '../models/product-list-policy';
import { PRODUCT_PAGE_SIZES } from '../models/product-list.models';
import type { ProductPageSize } from '../models/product-list.models';
import type { Product } from '../models/products.models';

@Injectable()
export class ProductsListComponentStore {
  private readonly productPort = inject(PRODUCT_LIST_PORT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _products = signal<readonly Product[]>([]);
  private readonly _searchTerm = signal('');
  private readonly _pageSize = signal<ProductPageSize>(PRODUCT_PAGE_SIZES[0]);
  private readonly _pageIndex = signal(0);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | undefined>(undefined);
  private activeLoad?: Subscription;

  readonly products = this._products.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  private readonly searchIndex = computed(() => indexProducts(this._products()));
  readonly filteredProducts = computed(() => {
    if (!this._searchTerm().trim()) return this._products();
    return filterProducts(this.searchIndex(), this._searchTerm());
  });
  readonly resultCount = computed(() => this.filteredProducts().length);
  readonly pageCount = computed(() => pageCountFor(this.resultCount(), this._pageSize()));
  readonly visibleProducts = computed(() =>
    visiblePage(this.filteredProducts(), this._pageIndex(), this._pageSize()),
  );
  readonly firstVisible = computed(() =>
    this.resultCount() ? this._pageIndex() * this._pageSize() + 1 : 0,
  );
  readonly lastVisible = computed(() =>
    Math.min((this._pageIndex() + 1) * this._pageSize(), this.resultCount()),
  );
  readonly currentPage = computed(() => (this.pageCount() ? this._pageIndex() + 1 : 0));
  readonly canGoPrevious = computed(() => this._pageIndex() > 0);
  readonly canGoNext = computed(() => this._pageIndex() + 1 < this.pageCount());
  readonly emptyMessage = computed(() =>
    this._searchTerm().trim()
      ? 'No encontramos productos que coincidan con la búsqueda.'
      : 'Aún no hay productos para mostrar.',
  );

  load(): void {
    this.activeLoad?.unsubscribe();
    this._isLoading.set(true);
    this._error.set(undefined);
    this.activeLoad = this.productPort
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (products) => this.setProducts(products),
        error: (error: unknown) =>
          this._error.set(
            error instanceof UserFacingError
              ? error.message
              : 'No se pudieron cargar los productos.',
          ),
      });
  }

  setProducts(products: readonly Product[]): void {
    this._products.set([...products]);
    this._pageIndex.set(clampPageIndex(this._pageIndex(), this.pageCount()));
  }

  removeProduct(id: string): void {
    this.setProducts(this._products().filter((product) => product.id !== id));
  }

  setSearchTerm(searchTerm: string): void {
    this._searchTerm.set(searchTerm);
    this._pageIndex.set(0);
  }

  setPageSize(pageSize: ProductPageSize): void {
    this._pageSize.set(pageSize);
    this._pageIndex.set(0);
  }

  setPageIndex(pageIndex: number): void {
    if (!Number.isInteger(pageIndex)) return;
    this._pageIndex.set(clampPageIndex(pageIndex, this.pageCount()));
  }
}
