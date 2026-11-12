import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { Product } from '../models/products.models';
import {
  PRODUCT_DELETE_PORT,
  PRODUCT_FORM_PORT,
  PRODUCT_ID_VERIFIER,
  PRODUCT_LIST_PORT,
} from '../ports/product-ports';
import { ProductDeletionComponentStore } from './product-deletion.component-store';
import { ProductFormComponentStore } from './product-form.component-store';
import { ProductIdAvailability } from './product-id-availability';
import { ProductsListComponentStore } from './products-list.component-store';

describe('product state ports', () => {
  it('loads the list without a deletion provider', () => {
    const list = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      providers: [{ provide: PRODUCT_LIST_PORT, useValue: { list } }, ProductsListComponentStore],
    });

    const store = TestBed.inject(ProductsListComponentStore);
    store.load();
    expect(list).toHaveBeenCalledOnce();
    expect(store.resultCount()).toBe(0);
  });

  it('runs list and form state with substitute ports and no HTTP client', async () => {
    const product: Product = {
      id: 'solid-1',
      name: 'Producto SOLID',
      description: 'Producto de prueba',
      logo: '/assets/logo.png',
      dateRelease: '2027-01-01',
      dateRevision: '2028-01-01',
    };
    const list = vi.fn(() => of([product]));
    const remove = vi.fn(() => of(undefined));
    const get = vi.fn(() => of(product));
    const update = vi.fn(() => of({ ...product, name: 'Producto editado' }));

    TestBed.configureTestingModule({
      providers: [
        { provide: PRODUCT_LIST_PORT, useValue: { list } },
        { provide: PRODUCT_DELETE_PORT, useValue: { remove } },
        { provide: PRODUCT_FORM_PORT, useValue: { get, create: () => of(product), update } },
        { provide: PRODUCT_ID_VERIFIER, useValue: { isIdTaken: () => of(false) } },
        ProductIdAvailability,
        ProductsListComponentStore,
        ProductDeletionComponentStore,
        ProductFormComponentStore,
      ],
    });

    const listStore = TestBed.inject(ProductsListComponentStore);
    listStore.load();
    expect(listStore.visibleProducts()).toEqual([product]);
    expect(list).toHaveBeenCalledOnce();

    const formStore = TestBed.inject(ProductFormComponentStore);
    formStore.load(product.id);
    expect(formStore.model().name).toBe(product.name);
    formStore.model.update((current) => ({ ...current, name: 'Producto editado' }));
    expect(await formStore.update()).toBe(true);
    expect(update).toHaveBeenCalledWith({ ...product, name: 'Producto editado' });

    expect(await TestBed.inject(ProductDeletionComponentStore).deleteProduct(product.id)).toBe(
      true,
    );
    listStore.removeProduct(product.id);
    expect(listStore.resultCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith(product.id);
  });
});
