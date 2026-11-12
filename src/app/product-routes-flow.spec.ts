import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { revisionDateFor, todayDateOnly } from '@products/models/product-dates';
import { ProductsList } from '@products/pages/products-list/products-list';
import { routes } from './app.routes';

describe('product route flows', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  function setValue(root: HTMLElement, selector: string, value: string): void {
    const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('redirects an unknown route to the list and loads its data', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/missing/path', ProductsList);
    http.expectOne('/bp/products').flush({ data: [] });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/products');
    expect(harness.routeNativeElement?.textContent).toContain('Aún no hay productos');
  });

  it('creates a product through real routes and reloads it in the list', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', ProductsList);
    http.expectOne('/bp/products').flush({ data: [] });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products');

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a.add-button')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products/new');
    const form = harness.routeNativeElement!;
    const release = todayDateOnly();
    const product = {
      id: 'visa-001',
      name: 'Visa Signature',
      description: 'Tarjeta de crédito de ejemplo',
      logo: 'https://example.com/visa.jpg',
      date_release: release,
      date_revision: revisionDateFor(release),
    };
    setValue(form, '#product-name', product.name);
    setValue(form, '#product-description', product.description);
    setValue(form, '#product-logo', product.logo);
    setValue(form, '#date-release', product.date_release);
    setValue(form, '#product-id', product.id);
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectOne('/bp/products/verification/visa-001').flush(false);
    await harness.fixture.whenStable();
    expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);

    form
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    const create = http.expectOne('/bp/products');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(product);
    const confirmation = vi.spyOn(window, 'confirm');
    create.flush({ message: 'Product added successfully', data: product });
    await harness.fixture.whenStable();
    http.expectOne('/bp/products').flush({ data: [product] });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/products');
    expect(confirmation).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.querySelector('tbody')?.textContent).toContain(
      'Visa Signature',
    );
    expect(harness.routeNativeElement?.querySelector('.table-footer p')?.textContent).toContain(
      '1 resultado',
    );
  });

  it('opens edit from the product name, shows 404, and returns to the list', async () => {
    const product = {
      id: 'missing',
      name: 'Producto retirado',
      description: 'Producto de ejemplo',
      logo: 'https://example.com/logo.jpg',
      date_release: '2030-01-01',
      date_revision: '2031-01-01',
    };
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products', ProductsList);
    http.expectOne('/bp/products').flush({ data: [product] });
    await harness.fixture.whenStable();

    const name =
      harness.routeNativeElement!.querySelector<HTMLAnchorElement>('tbody .product-name a')!;
    expect(name.getAttribute('href')).toBe('/products/missing/edit');
    name.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/bp/products/missing').flush({}, { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/products/missing/edit');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'ya no existe',
    );
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a.back-link')!.click();
    await harness.fixture.whenStable();
    http.expectOne('/bp/products').flush({ data: [] });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products');
  });
});
