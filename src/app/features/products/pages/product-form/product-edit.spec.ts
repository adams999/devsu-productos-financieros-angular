import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ToastService } from '@app/core/notifications/toast.service';
import { unsavedProductChangesGuard } from '@products/guards/unsaved-product-changes-guard';
import { ProductFormComponentStore } from '@products/state/product-form.component-store';
import { ProductIdAvailability } from '@products/state/product-id-availability';
import { PRODUCT_PROVIDERS } from '@products/products.providers';
import { todayDateOnly } from '@products/models/product-dates';
import { ProductForm } from './product-form';

@Component({ template: '' })
class ListDestination {}

describe('ProductForm editing', () => {
  let http: HttpTestingController;
  const product = {
    id: 'visa-001',
    name: 'Visa Signature',
    description: 'Tarjeta de crédito de ejemplo',
    logo: 'https://example.com/visa.jpg',
    date_release: '2030-01-01',
    date_revision: '2031-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...PRODUCT_PROVIDERS,
        provideRouter([
          { path: 'products', component: ListDestination },
          {
            path: 'products/new',
            component: ProductForm,
            providers: [ProductIdAvailability, ProductFormComponentStore],
            canDeactivate: [unsavedProductChangesGuard],
          },
          {
            path: 'products/:id/edit',
            component: ProductForm,
            providers: [ProductIdAvailability, ProductFormComponentStore],
            canDeactivate: [unsavedProductChangesGuard],
          },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  async function openEdit(
    response: Partial<typeof product> = product,
    status = 200,
  ): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create();
    const navigating = harness.navigateByUrl('/products/visa-001/edit', ProductForm);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const request = http.expectOne('/bp/products/visa-001');
    if (status === 200) request.flush(response);
    else request.flush(response, { status, statusText: 'Not Found' });
    await navigating;
    await harness.fixture.whenStable();
    return harness;
  }

  function changeName(root: HTMLElement, name: string): void {
    const input = root.querySelector<HTMLInputElement>('#product-name')!;
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('loads the product, keeps ID disabled, restores changes and saves without ID in body', async () => {
    const harness = await openEdit();
    const root = harness.routeNativeElement!;
    const id = root.querySelector<HTMLInputElement>('#product-id')!;
    expect(id.value).toBe('visa-001');
    expect(id.disabled).toBe(true);
    http.expectNone('/bp/products/verification/visa-001');
    const undo = root.querySelector<HTMLButtonElement>('button.secondary')!;
    expect(undo.textContent).toContain('Deshacer cambios');
    expect(undo.disabled).toBe(true);

    changeName(root, 'Nombre editado');
    await harness.fixture.whenStable();
    expect(undo.disabled).toBe(false);
    undo.click();
    await harness.fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#product-name')!.value).toBe(product.name);
    expect(undo.disabled).toBe(true);

    changeName(root, 'Nombre editado');
    await harness.fixture.whenStable();
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    const request = http.expectOne('/bp/products/visa-001');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Nombre editado',
      description: product.description,
      logo: product.logo,
      date_release: product.date_release,
      date_revision: product.date_revision,
    });
    const confirmation = vi.spyOn(window, 'confirm');
    request.flush({ message: 'Product updated successfully', data: request.request.body });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products');
    expect(TestBed.inject(ToastService).notice()).toMatchObject({
      kind: 'success',
      message: 'Producto actualizado correctamente.',
    });
    expect(confirmation).not.toHaveBeenCalled();
  });

  it('shows 404 with retry and leaves the form unavailable', async () => {
    const harness = await openEdit({}, 404);
    const root = harness.routeNativeElement!;
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('ya no existe');
    expect(root.querySelector('form')).toBeNull();

    root.querySelector<HTMLButtonElement>('.load-failure button')!.click();
    http.expectOne('/bp/products/visa-001').flush(product);
    await harness.fixture.whenStable();
    expect(root.querySelector('form')).not.toBeNull();
  });

  it('keeps edited values and shows an error notice when saving fails', async () => {
    const harness = await openEdit();
    const root = harness.routeNativeElement!;
    changeName(root, 'Nombre editado');
    await harness.fixture.whenStable();

    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    http
      .expectOne('/bp/products/visa-001')
      .flush({ message: 'Invalid body' }, { status: 400, statusText: 'Bad Request' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/products/visa-001/edit');
    expect(root.querySelector<HTMLInputElement>('#product-name')?.value).toBe('Nombre editado');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('datos enviados');
    expect(TestBed.inject(ToastService).notice()).toMatchObject({ kind: 'error' });
  });

  it('loads the new product when the edit route changes its ID on the same component', async () => {
    const harness = await openEdit();
    const component = harness.routeDebugElement?.componentInstance;
    const navigating = harness.navigateByUrl('/products/other/edit', ProductForm);
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/bp/products/other').flush({ ...product, id: 'other', name: 'Otro producto' });
    await navigating;
    await harness.fixture.whenStable();

    expect(harness.routeDebugElement?.componentInstance).toBe(component);
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#product-id')?.value).toBe(
      'other',
    );
    expect(
      harness.routeNativeElement?.querySelector<HTMLInputElement>('#product-name')?.value,
    ).toBe('Otro producto');
  });

  it('keeps unsaved edits when a change of product ID is canceled', async () => {
    const harness = await openEdit();
    changeName(harness.routeNativeElement!, 'Nombre sin guardar');
    await harness.fixture.whenStable();
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(await TestBed.inject(Router).navigateByUrl('/products/other/edit')).toBe(false);
    expect(confirmation).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/products/visa-001/edit');
    expect(
      harness.routeNativeElement?.querySelector<HTMLInputElement>('#product-name')?.value,
    ).toBe('Nombre sin guardar');
    http.expectNone('/bp/products/other');
  });

  it('does not update invalid edits and Reset restores every edited field and revision', async () => {
    const harness = await openEdit();
    const root = harness.routeNativeElement!;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    changeName(root, 'Short');
    const logo = root.querySelector<HTMLInputElement>('#product-logo')!;
    logo.value = 'http://example.com/logo.png';
    logo.dispatchEvent(new Event('input', { bubbles: true }));
    const release = root.querySelector<HTMLInputElement>('#date-release')!;
    release.value = todayDateOnly(yesterday);
    release.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();

    expect(root.querySelector('#product-name-error')?.textContent).toContain('6 caracteres');
    expect(root.querySelector('#product-logo-error')?.textContent).toContain('HTTPS');
    expect(root.querySelector('#date-release-error')?.textContent).toContain('igual o posterior');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone('/bp/products/visa-001');

    root.querySelector<HTMLButtonElement>('button.secondary')!.click();
    await harness.fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#product-name')?.value).toBe(product.name);
    expect(root.querySelector<HTMLInputElement>('#product-logo')?.value).toBe(product.logo);
    expect(root.querySelector<HTMLInputElement>('#date-release')?.value).toBe(product.date_release);
    expect(root.querySelector<HTMLInputElement>('#date-revision')?.value).toBe(
      product.date_revision,
    );
    expect(root.querySelector('.field-error')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    http.expectNone('/bp/products/visa-001');
  });

  it('asks before leaving dirty edits and respects cancellation', async () => {
    const harness = await openEdit();
    changeName(harness.routeNativeElement!, 'Nombre editado');
    await harness.fixture.whenStable();
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(await TestBed.inject(Router).navigateByUrl('/products')).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/products/visa-001/edit');
    expect(confirmation).toHaveBeenCalledOnce();

    confirmation.mockReturnValue(true);
    expect(await TestBed.inject(Router).navigateByUrl('/products')).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('warns before abandoning a new product and allows leaving after confirmation', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/new', ProductForm);
    const root = harness.routeNativeElement!;
    changeName(root, 'Producto nuevo');
    await harness.fixture.whenStable();

    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(await TestBed.inject(Router).navigateByUrl('/products')).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/products/new');
    expect(confirmation).toHaveBeenCalledOnce();

    confirmation.mockReturnValue(true);
    expect(await TestBed.inject(Router).navigateByUrl('/products')).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('allows leaving a pristine or reset creation form without warning', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/new', ProductForm);
    const confirmation = vi.spyOn(window, 'confirm');
    expect(await TestBed.inject(Router).navigateByUrl('/products')).toBe(true);
    expect(confirmation).not.toHaveBeenCalled();
  });
});
