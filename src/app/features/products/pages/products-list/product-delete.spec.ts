import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@app/core/notifications/toast.service';
import type { ProductDto } from '@products/data/product-mapper';
import { PRODUCT_DATA_PROVIDERS } from '@products/data/product-providers';
import { ProductsListComponentStore } from '@products/state/products-list.component-store';
import { ProductDeletionComponentStore } from '@products/state/product-deletion.component-store';
import { ProductsList } from './products-list';

describe('ProductsList deletion', () => {
  let http: HttpTestingController;
  const products: ProductDto[] = Array.from({ length: 6 }, (_, index) => ({
    id: `product-${index + 1}`,
    name: `Producto ${index + 1}`,
    description: 'Tarjeta de crédito',
    logo: 'https://example.com/logo.jpg',
    date_release: '2027-01-01',
    date_revision: '2028-01-01',
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...PRODUCT_DATA_PROVIDERS,
        ProductsListComponentStore,
        ProductDeletionComponentStore,
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function openList(): Promise<{
    root: HTMLElement;
    store: ProductsListComponentStore;
    fixture: ComponentFixture<ProductsList>;
  }> {
    const fixture = TestBed.createComponent(ProductsList);
    http.expectOne('/bp/products').flush({ data: products });
    await fixture.whenStable();
    return {
      root: fixture.nativeElement as HTMLElement,
      store: TestBed.inject(ProductsListComponentStore),
      fixture,
    };
  }

  async function openDelete(
    root: HTMLElement,
    fixture: ComponentFixture<ProductsList>,
  ): Promise<HTMLDialogElement> {
    const menu = root.querySelector<HTMLButtonElement>(
      'tbody app-action-menu .action-menu-trigger',
    )!;
    menu.click();
    const trigger = root.querySelector<HTMLButtonElement>('tbody app-action-menu .danger-action')!;
    trigger.focus();
    trigger.click();
    await fixture.whenStable();
    return root.querySelector<HTMLDialogElement>('app-action-confirm-dialog dialog')!;
  }

  it('cancels without an API call and restores focus', async () => {
    const { root, fixture } = await openList();
    const dialog = await openDelete(root, fixture);
    expect(dialog.textContent).toContain('Producto 1');
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const titleId = dialog.getAttribute('aria-labelledby');
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(root.querySelector('app-action-confirm-dialog')?.hasAttribute('title')).toBe(false);
    expect(dialog.querySelector(`#${titleId}`)?.textContent).toContain('Eliminar producto');
    expect(dialog.querySelector(`#${descriptionId}`)?.textContent).toContain('Producto 1');
    expect(dialog.querySelector('button.secondary')?.textContent).toContain('Cancelar');
    expect(dialog.querySelector('button.primary')?.textContent).toContain('Confirmar');
    expect(document.activeElement?.textContent).toContain('Cancelar');

    dialog.querySelector<HTMLButtonElement>('button.secondary')!.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.querySelector('app-action-confirm-dialog')).toBeNull();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Acciones para Producto 1');
    http.expectNone('/bp/products/product-1');
  });

  it('deletes once and moves back when the last page becomes empty', async () => {
    const { root, store, fixture } = await openList();
    store.setPageIndex(1);
    await fixture.whenStable();
    const dialog = await openDelete(root, fixture);
    expect(dialog.textContent).toContain('Producto 6');

    const confirm = dialog.querySelector<HTMLButtonElement>('button.primary')!;
    confirm.click();
    confirm.click();
    const request = http.expectOne('/bp/products/product-6');
    expect(request.request.method).toBe('DELETE');
    expect(TestBed.inject(ProductDeletionComponentStore).isDeleting()).toBe(true);
    await fixture.whenStable();
    expect(dialog.querySelector<HTMLButtonElement>('button.primary')?.disabled).toBe(true);
    expect(confirm.textContent).toContain('Eliminando');

    request.flush({ message: 'Product removed successfully' });
    await Promise.resolve();
    await Promise.resolve();
    await fixture.whenStable();
    expect(root.querySelector('app-action-confirm-dialog')).toBeNull();
    expect(store.pageIndex()).toBe(0);
    expect(store.resultCount()).toBe(5);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(root.querySelector('.table-footer p')?.textContent).toContain('5 resultados');
    expect(TestBed.inject(ToastService).notice()).toMatchObject({
      kind: 'success',
      message: 'Producto eliminado correctamente.',
    });
  });

  it('keeps the dialog and product on a 404, then allows retry', async () => {
    const { root, store, fixture } = await openList();
    const dialog = await openDelete(root, fixture);
    dialog.querySelector<HTMLButtonElement>('button.primary')!.click();
    http.expectOne('/bp/products/product-1').flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(root.querySelector('app-action-confirm-dialog')).not.toBeNull();
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain('ya no existe');
    expect(TestBed.inject(ToastService).notice()).toBeUndefined();
    expect(store.resultCount()).toBe(6);

    dialog.querySelector<HTMLButtonElement>('button.primary')!.click();
    http.expectOne('/bp/products/product-1').flush({ message: 'Product removed successfully' });
    await fixture.whenStable();
    expect(store.resultCount()).toBe(5);
    expect(root.querySelector('app-action-confirm-dialog')).toBeNull();
  });

  it('ignores Escape while deleting and closes when idle', async () => {
    const { root, fixture } = await openList();
    const dialog = await openDelete(root, fixture);
    dialog.querySelector<HTMLButtonElement>('button.primary')!.click();
    const request = http.expectOne('/bp/products/product-1');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await fixture.whenStable();
    expect(root.querySelector('app-action-confirm-dialog')).not.toBeNull();

    request.flush({}, { status: 0, statusText: 'Unknown Error' });
    await Promise.resolve();
    await fixture.whenStable();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await Promise.resolve();
    await fixture.whenStable();
    expect(root.querySelector('app-action-confirm-dialog')).toBeNull();
  });
});
