import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ProductForm } from '@products/pages/product-form/product-form';
import { ProductsList } from '@products/pages/products-list/products-list';
import { routes } from './app.routes';

describe('product routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('redirects the root path to the list', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/', ProductsList);

    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('loads the product list directly', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/products', ProductsList);

    expect(harness.routeNativeElement?.textContent).toContain('Productos financieros');
  });

  it('loads the creation page', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/products/new', ProductForm);

    expect(harness.routeNativeElement?.textContent).toContain('Formulario de Registro');
  });

  it('loads the edit page with a product id', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/products/example/edit', ProductForm);

    expect(harness.routeNativeElement?.textContent).toContain('Editar producto');
  });
});
