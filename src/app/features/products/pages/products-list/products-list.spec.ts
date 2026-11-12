import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { ProductDto } from '@products/data/product-mapper';
import { PRODUCT_DATA_PROVIDERS } from '@products/data/product-providers';
import { ProductsListComponentStore } from '@products/state/products-list.component-store';
import { ProductDeletionComponentStore } from '@products/state/product-deletion.component-store';
import { ProductsList } from './products-list';

describe('ProductsList', () => {
  let http: HttpTestingController;

  const products: ProductDto[] = Array.from({ length: 12 }, (_, index) => ({
    id: `product-${index + 1}`,
    name: index === 6 ? 'Crédito Premium' : `Producto ${index + 1}`,
    description: 'Tarjeta de crédito',
    logo: 'https://example.com/logo.jpg',
    date_release: '2026-12-01',
    date_revision: '2027-12-01',
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

  async function settleSearch(fixture: ComponentFixture<ProductsList>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 520));
    await fixture.whenStable();
  }

  it('shows API rows, filters them locally and changes page size', async () => {
    const fixture = TestBed.createComponent(ProductsList);
    http.expectOne('/bp/products').flush({ data: products });
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const rows = () => root.querySelectorAll('tbody tr');
    expect(rows()).toHaveLength(5);
    expect(root.querySelector('.table-footer p')?.textContent).toContain('12 resultados');
    expect(root.querySelector('.table-footer p')?.textContent).toContain('1–5');

    const tableScroll = root.querySelector<HTMLElement>('.table-scroll')!;
    tableScroll.scrollTop = 120;
    const next = root.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!;
    next.click();
    await fixture.whenStable();
    expect(tableScroll.scrollTop).toBe(0);
    expect(rows()).toHaveLength(5);
    expect(root.querySelector('.table-footer p')?.textContent).toContain('6–10');

    const search = root.querySelector<HTMLInputElement>('#product-search')!;
    tableScroll.scrollTop = 120;
    search.value = 'CREDITO PREMIUM';
    search.dispatchEvent(new Event('input'));
    expect(rows()).toHaveLength(5);
    await settleSearch(fixture);
    expect(tableScroll.scrollTop).toBe(0);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Crédito Premium');
    expect(root.querySelector('.table-footer p')?.textContent).toContain('1 resultado');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    const pageSize = root.querySelector<HTMLSelectElement>('app-pagination select')!;
    tableScroll.scrollTop = 120;
    pageSize.value = '10';
    pageSize.dispatchEvent(new Event('change'));
    await settleSearch(fixture);
    expect(tableScroll.scrollTop).toBe(0);
    expect(rows()).toHaveLength(10);
    expect(root.querySelector('.table-footer p')?.textContent).toContain('1–10');
  });

  it('shows distinct empty, no-match and retry states', async () => {
    const fixture = TestBed.createComponent(ProductsList);
    http.expectOne('/bp/products').flush({ data: [] });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.empty-cell')?.textContent).toContain('Aún no hay');

    const search = root.querySelector<HTMLInputElement>('#product-search')!;
    search.value = 'visa';
    search.dispatchEvent(new Event('input'));
    await settleSearch(fixture);
    expect(root.querySelector('.empty-cell')?.textContent).toContain('coincidan');

    TestBed.inject(ProductsListComponentStore).load();
    http.expectOne('/bp/products').error(new ProgressEvent('error'));
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar');

    root.querySelector<HTMLButtonElement>('.feedback button')!.click();
    http.expectOne('/bp/products').flush({ data: products });
    await fixture.whenStable();
    expect(root.querySelector('.empty-cell')?.textContent).toContain('coincidan');
    expect(root.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows all records at size 20 and keeps accessible search, paging and menu controls', async () => {
    const fixture = TestBed.createComponent(ProductsList);
    http.expectOne('/bp/products').flush({ data: products });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const search = root.querySelector<HTMLInputElement>('#product-search')!;
    const pageSize = root.querySelector<HTMLSelectElement>('app-pagination select')!;
    const next = root.querySelector<HTMLButtonElement>('button[aria-label="Página siguiente"]')!;
    const previous = root.querySelector<HTMLButtonElement>('button[aria-label="Página anterior"]')!;

    expect(root.querySelector('label[for="product-search"]')?.textContent).toContain(
      'Buscar productos',
    );
    expect(root.querySelector(`label[for="${pageSize.id}"]`)?.textContent).toContain(
      'Registros por página',
    );
    expect([...pageSize.options].map((option) => option.value)).toEqual(['5', '10', '20']);
    expect(root.querySelector('a.add-button')?.getAttribute('href')).toBe('/products/new');
    expect(root.querySelector('nav[aria-label="Páginas de productos"]')).not.toBeNull();

    pageSize.value = '20';
    pageSize.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(12);
    expect(root.querySelector('.table-footer p')?.textContent).toContain('1–12');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);

    search.focus();
    expect(document.activeElement).toBe(search);
    search.value = 'sin coincidencias';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settleSearch(fixture);
    expect(root.querySelector('.empty-cell')?.textContent).toContain('coincidan');
    expect(root.querySelector('.table-footer p')?.textContent).toContain('0 resultados');

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settleSearch(fixture);
    const menu = root.querySelector<HTMLButtonElement>(
      'tbody app-action-menu .action-menu-trigger',
    )!;
    expect(menu.getAttribute('aria-label')).toBe('Acciones para Producto 1');
    menu.focus();
    expect(document.activeElement).toBe(menu);
    menu.click();
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(
      [...menu.parentElement!.querySelectorAll('.action-menu-panel button')].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(['Editar', 'Eliminar']);
  });

  it('opens the edit route from the selected row menu', async () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProductsList);
    http.expectOne('/bp/products').flush({ data: products });
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const menu = root.querySelector<HTMLButtonElement>(
      'tbody app-action-menu .action-menu-trigger',
    )!;
    menu.click();
    root
      .querySelector<HTMLButtonElement>('tbody app-action-menu .action-menu-panel button')!
      .click();

    expect(navigation).toHaveBeenCalledWith(['/products', 'product-1', 'edit']);
    navigation.mockRestore();
  });
});
