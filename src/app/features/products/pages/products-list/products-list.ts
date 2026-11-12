import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '@app/core/notifications/toast.service';
import type { Product } from '@products/models/products.models';
import { isProductPageSize, PRODUCT_PAGE_SIZES } from '@products/models/product-list.models';
import { ProductsListComponentStore } from '@products/state/products-list.component-store';
import { ProductDeletionComponentStore } from '@products/state/product-deletion.component-store';
import { ActionConfirmDialog } from '@app/shared/ui/action-confirm-dialog/action-confirm-dialog';
import type { ActionMenuItem } from '@app/shared/ui/action-menu/action-menu.models';
import { FocusRestorer } from '@app/shared/browser/focus-restorer';
import { SearchField } from '@app/shared/ui/search-field/search-field';
import { Pagination } from '@app/shared/ui/pagination/pagination';
import { ProductsTable } from '@products/ui/products-table/products-table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionConfirmDialog, Pagination, ProductsTable, RouterLink, SearchField],
  selector: 'app-products-list',
  styleUrl: './products-list.scss',
  templateUrl: './products-list.html',
})
export class ProductsList {
  protected readonly store = inject(ProductsListComponentStore);
  protected readonly deletion = inject(ProductDeletionComponentStore);
  protected readonly selectedProduct = signal<Product | undefined>(undefined);
  protected readonly pageSizes = PRODUCT_PAGE_SIZES;
  protected readonly rowActions: readonly ActionMenuItem[] = [
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Eliminar', destructive: true },
  ];
  protected readonly productLink = (product: Product): string[] => [
    '/products',
    product.id,
    'edit',
  ];
  private readonly router = inject(Router);
  private readonly focusRestorer = inject(FocusRestorer);
  private readonly toast = inject(ToastService);
  private readonly table = viewChild.required(ProductsTable);
  private dialogTrigger?: HTMLElement;

  constructor() {
    this.store.load();
  }

  protected onPageSizeChange(value: number): void {
    if (!isProductPageSize(value)) return;
    this.store.setPageSize(value);
    this.table().scrollToTop();
  }

  protected onPageChange(page: number): void {
    this.store.setPageIndex(page - 1);
    this.table().scrollToTop();
  }

  protected onSearchInput(value: string): void {
    this.store.setSearchTerm(value);
    this.table().scrollToTop();
  }

  protected onEdit(id: string): void {
    void this.router.navigate(['/products', id, 'edit']);
  }

  protected onRowAction(event: { id: string; product: Product }): void {
    if (event.id === 'edit') this.onEdit(event.product.id);
    else if (event.id === 'delete') this.onDeleteRequested(event.product);
  }

  protected onDeleteRequested(product: Product): void {
    this.dialogTrigger = this.focusRestorer.capture();
    this.deletion.clearError();
    this.selectedProduct.set(product);
  }

  protected onCancelDelete(): void {
    if (this.deletion.isDeleting()) return;
    this.closeDialog();
  }

  protected async onConfirmDelete(): Promise<void> {
    const product = this.selectedProduct();
    if (!product || this.deletion.isDeleting()) return;
    if (await this.deletion.deleteProduct(product.id)) {
      this.store.removeProduct(product.id);
      this.table().scrollToTop();
      this.closeDialog();
      this.toast.success('Producto eliminado correctamente.');
    }
  }

  private closeDialog(): void {
    this.selectedProduct.set(undefined);
    this.focusRestorer.restore(this.dialogTrigger, '#product-search');
    this.dialogTrigger = undefined;
  }
}
