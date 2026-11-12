import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductFormComponentStore } from './product-form.component-store';
import { ProductsListComponentStore } from './products-list.component-store';
import { ProductIdAvailability } from './product-id-availability';
import { PRODUCT_DATA_PROVIDERS } from '../data/product-providers';
import type { ProductDto } from '../data/product-mapper';
import type { Product } from '../models/products.models';

describe('products route state', () => {
  let http: HttpTestingController;
  const product: ProductDto = {
    id: 'visa-001',
    name: 'Visa Signature',
    description: 'Tarjeta de crédito de ejemplo',
    logo: 'https://example.com/visa.jpg',
    date_release: '2026-12-01',
    date_revision: '2027-12-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...PRODUCT_DATA_PROVIDERS,
        ProductsListComponentStore,
        ProductIdAvailability,
        ProductFormComponentStore,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads API products into list state and clears the loading flag', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.load();
    expect(store.isLoading()).toBe(true);

    http.expectOne('/bp/products').flush({ data: [product] });

    expect(store.products()).toMatchObject([{ id: product.id, dateRelease: product.date_release }]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeUndefined();
  });

  it('keeps list data and exposes a safe message when a refresh fails', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.load();
    http.expectOne('/bp/products').flush({ data: [product] });

    store.load();
    http.expectOne('/bp/products').error(new ProgressEvent('error'));

    expect(store.products()).toHaveLength(1);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toContain('No se pudo conectar');
  });

  it('cancels an obsolete list request so only the latest load updates state', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.load();
    const obsolete = http.expectOne('/bp/products');
    store.load();
    expect(obsolete.cancelled).toBe(true);
    expect(store.isLoading()).toBe(true);

    http.expectOne('/bp/products').flush({ data: [{ ...product, id: 'latest' }] });
    expect(store.products().map((item) => item.id)).toEqual(['latest']);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeUndefined();
  });

  it('loads the edit model without keeping a second product collection', () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.load(product.id);
    expect(store.isLoading()).toBe(true);

    http.expectOne('/bp/products/visa-001').flush(product);

    expect(store.model()).toMatchObject({ id: product.id, dateRevision: product.date_revision });
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeUndefined();
  });

  it('cancels an obsolete edit request and retains only the latest product', () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.load('older');
    const obsolete = http.expectOne('/bp/products/older');
    store.load('newer');
    expect(obsolete.cancelled).toBe(true);
    expect(store.isLoading()).toBe(true);
    expect(store.hasLoadedProduct()).toBe(false);

    http.expectOne('/bp/products/newer').flush({ ...product, id: 'newer' });
    expect(store.model().id).toBe('newer');
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeUndefined();
  });

  it('debounces rapid ID changes and verifies only the final candidate', async () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.verifyId('first');
    store.verifyId('second');
    expect(store.idVerification()).toEqual({ id: 'second', status: 'pending' });
    http.expectNone('/bp/products/verification/first');

    await new Promise((resolve) => setTimeout(resolve, 350));
    const request = http.expectOne('/bp/products/verification/second');
    expect(request.request.method).toBe('GET');
    request.flush(false);
    expect(store.idVerification()).toEqual({ id: 'second', status: 'available' });
  });

  it('cancels an in-flight ID check and ignores its obsolete result', async () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.verifyId('first');
    await new Promise((resolve) => setTimeout(resolve, 350));
    const obsolete = http.expectOne('/bp/products/verification/first');

    store.verifyId('second');
    expect(obsolete.cancelled).toBe(true);
    expect(store.idVerification()).toEqual({ id: 'second', status: 'pending' });
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectOne('/bp/products/verification/second').flush(true);
    expect(store.idVerification()).toEqual({ id: 'second', status: 'taken' });
  });

  it('restores the loaded product and updates only editable fields', async () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.load(product.id);
    http.expectOne('/bp/products/visa-001').flush(product);

    store.model.update((current) => ({ ...current, name: 'Nombre editado' }));
    expect(store.hasUnsavedChanges()).toBe(true);
    store.reset();
    expect(store.model().name).toBe(product.name);
    expect(store.hasUnsavedChanges()).toBe(false);

    store.model.update((current) => ({ ...current, name: 'Nombre editado' }));
    const save = store.update();
    expect(store.isSaving()).toBe(true);
    const request = http.expectOne('/bp/products/visa-001');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Nombre editado',
      description: product.description,
      logo: product.logo,
      date_release: product.date_release,
      date_revision: product.date_revision,
    });
    request.flush({ message: 'Product updated successfully', data: request.request.body });
    expect(await save).toBe(true);
    expect(store.hasUnsavedChanges()).toBe(false);
    expect(store.model().id).toBe(product.id);
  });

  it('keeps edits on a failed update and exposes a missing product', async () => {
    const store = TestBed.inject(ProductFormComponentStore);
    store.load(product.id);
    http.expectOne('/bp/products/visa-001').flush(product);
    store.model.update((current) => ({ ...current, name: 'Nombre editado' }));

    const save = store.update();
    http.expectOne('/bp/products/visa-001').flush({}, { status: 400, statusText: 'Bad Request' });
    expect(await save).toBe(false);
    expect(store.model().name).toBe('Nombre editado');
    expect(store.hasUnsavedChanges()).toBe(true);
    expect(store.error()).toContain('datos enviados');

    store.load('missing');
    http.expectOne('/bp/products/missing').flush({}, { status: 404, statusText: 'Not Found' });
    expect(store.hasLoadedProduct()).toBe(false);
    expect(store.error()).toContain('ya no existe');
  });

  const products: Product[] = Array.from({ length: 12 }, (_, index) => ({
    id: `product-${index + 1}`,
    name: index === 6 ? 'Crédito Premium' : `Producto ${index + 1}`,
    description: index === 6 ? 'Tarjeta de viaje' : 'Producto financiero',
    logo: 'https://example.com/logo.jpg',
    dateRelease: '2026-12-01',
    dateRevision: '2027-12-01',
  }));

  it('paginates the filtered collection and reports the visible range', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.setProducts(products);

    expect(store.resultCount()).toBe(12);
    expect(store.visibleProducts()).toHaveLength(5);
    expect([store.firstVisible(), store.lastVisible(), store.pageCount()]).toEqual([1, 5, 3]);

    store.setPageIndex(2);
    expect(store.visibleProducts().map((item) => item.id)).toEqual(['product-11', 'product-12']);
    expect([store.firstVisible(), store.lastVisible(), store.currentPage()]).toEqual([11, 12, 3]);

    store.setPageIndex(200);
    expect(store.pageIndex()).toBe(2);
    store.setPageIndex(-4);
    expect(store.pageIndex()).toBe(0);
  });

  it('supports page sizes 5, 10 and 20 and resets the current page', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.setProducts(products);
    store.setPageIndex(2);

    store.setPageSize(10);
    expect([store.pageIndex(), store.pageCount(), store.visibleProducts().length]).toEqual([
      0, 2, 10,
    ]);

    store.setPageSize(20);
    expect([store.pageIndex(), store.pageCount(), store.visibleProducts().length]).toEqual([
      0, 1, 12,
    ]);

    store.setPageSize(5);
    expect(store.visibleProducts()).toHaveLength(5);
  });

  it('searches id, name and description without case or accent sensitivity', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.setProducts(products);
    store.setPageIndex(2);

    store.setSearchTerm('  CREDITO  ');
    expect(store.visibleProducts().map((item) => item.id)).toEqual(['product-7']);
    expect([
      store.pageIndex(),
      store.resultCount(),
      store.firstVisible(),
      store.lastVisible(),
    ]).toEqual([0, 1, 1, 1]);

    store.setSearchTerm('PRODUCT-12');
    expect(store.visibleProducts()[0]?.id).toBe('product-12');

    store.setSearchTerm('viaje');
    expect(store.visibleProducts()[0]?.id).toBe('product-7');

    store.setSearchTerm('nada');
    expect([
      store.resultCount(),
      store.pageCount(),
      store.firstVisible(),
      store.lastVisible(),
    ]).toEqual([0, 0, 0, 0]);
    expect(store.emptyMessage()).toContain('coincidan');
  });

  it('clamps the page when refreshed data shrinks and distinguishes an empty list', () => {
    const store = TestBed.inject(ProductsListComponentStore);
    store.setProducts(products);
    store.setPageIndex(2);
    store.setProducts(products.slice(0, 6));

    expect([store.pageIndex(), store.currentPage(), store.visibleProducts().length]).toEqual([
      1, 2, 1,
    ]);

    store.setProducts([]);
    expect([store.pageIndex(), store.pageCount(), store.resultCount()]).toEqual([0, 0, 0]);
    expect(store.emptyMessage()).toContain('Aún no hay');
  });
});
