import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '@app/core/notifications/toast.service';
import { ProductFormComponentStore } from '@products/state/product-form.component-store';
import { ProductIdAvailability } from '@products/state/product-id-availability';
import { PRODUCT_PROVIDERS } from '@products/products.providers';
import { revisionDateFor, todayDateOnly } from '@products/models/product-dates';
import { ProductForm } from './product-form';

@Component({ template: '' })
class ProductsDestination {}

describe('ProductForm creation', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'products', component: ProductsDestination }]),
        ...PRODUCT_PROVIDERS,
        ProductIdAvailability,
        ProductFormComponentStore,
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function setValue(root: HTMLElement, selector: string, value: string): void {
    const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function settleIdVerification(id: string, taken: boolean): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    http.expectOne(`/bp/products/verification/${encodeURIComponent(id)}`).flush(taken);
  }

  function futureRelease(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return todayDateOnly(date);
  }

  function yesterdayRelease(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return todayDateOnly(date);
  }

  it('shows required errors for an empty submission without sending a request', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    for (const field of [
      'product-id',
      'product-name',
      'product-description',
      'product-logo',
      'date-release',
    ]) {
      expect(root.querySelector(`#${field}-error`)?.textContent, field).toContain('obligatori');
      const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${field}`)!;
      expect(root.querySelector(`label[for="${field}"]`), field).not.toBeNull();
      expect(input.getAttribute('aria-invalid'), field).toBe('true');
      expect(input.getAttribute('aria-describedby'), field).toBe(`${field}-error`);
    }
    expect(root.querySelector('label[for="date-revision"]')).not.toBeNull();
    expect(root.querySelector('#date-revision')?.getAttribute('aria-describedby')).toContain(
      'date-revision-hint',
    );
    expect(root.querySelector<HTMLInputElement>('#date-revision')?.value).toBe('');
    http.expectNone('/bp/products');
  });

  it.each([
    { id: 'abc', nameLength: 6, descriptionLength: 10 },
    { id: 'abcdefghij', nameLength: 100, descriptionLength: 200 },
  ])(
    'accepts the inclusive text limits ($id, $nameLength, $descriptionLength)',
    async ({ id, nameLength, descriptionLength }) => {
      const fixture = TestBed.createComponent(ProductForm);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;

      setValue(root, '#product-name', 'N'.repeat(nameLength));
      setValue(root, '#product-description', 'D'.repeat(descriptionLength));
      setValue(root, '#product-logo', '/assets/logos/visa.png');
      setValue(root, '#date-release', futureRelease());
      setValue(root, '#product-id', id);
      await settleIdVerification(id, false);
      await fixture.whenStable();

      expect(root.querySelector('.field-error')).toBeNull();
      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
      http.expectNone('/bp/products');
    },
  );

  it('rejects yesterday, accepts today and tomorrow, and recomputes revision on each change', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const yesterday = yesterdayRelease();
    const today = todayDateOnly();
    const tomorrow = futureRelease();

    setValue(root, '#product-name', 'Visa Signature');
    setValue(root, '#product-description', 'Tarjeta de credito');
    setValue(root, '#product-logo', 'https://example.com/visa.png');
    setValue(root, '#product-id', 'visa-001');
    await settleIdVerification('visa-001', false);

    setValue(root, '#date-release', yesterday);
    await fixture.whenStable();
    expect(root.querySelector('#date-release-error')?.textContent).toContain('igual o posterior');
    expect(root.querySelector<HTMLInputElement>('#date-revision')?.value).toBe(
      revisionDateFor(yesterday),
    );
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone('/bp/products');

    for (const release of [today, tomorrow]) {
      setValue(root, '#date-release', release);
      await fixture.whenStable();
      expect(root.querySelector('#date-release-error')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('#date-revision')?.value).toBe(
        revisionDateFor(release),
      );
      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    }
  });

  it('shows field errors and does not verify a locally invalid ID', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    setValue(root, '#product-id', 'ab');
    setValue(root, '#product-name', 'Cinco');
    setValue(root, '#product-description', 'Corta');
    setValue(root, '#date-release', '2020-01-01');
    await fixture.whenStable();

    expect(root.querySelector('#product-id-error')?.textContent).toContain('3 caracteres');
    expect(root.querySelector('#product-name-error')?.textContent).toContain('6 caracteres');
    expect(root.querySelector('#product-description-error')?.textContent).toContain(
      '10 caracteres',
    );
    expect(root.querySelector('#date-release-error')?.textContent).toContain('igual o posterior');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    http.expectNone('/bp/products/verification/ab');
    http.expectNone('/bp/products');

    setValue(root, '#product-id', 'x'.repeat(11));
    setValue(root, '#product-name', 'x'.repeat(101));
    setValue(root, '#product-description', 'x'.repeat(201));
    await fixture.whenStable();
    expect(root.querySelector('#product-id-error')?.textContent).toContain('máximo 10');
    expect(root.querySelector('#product-name-error')?.textContent).toContain('máximo 100');
    expect(root.querySelector('#product-description-error')?.textContent).toContain('máximo 200');
    http.expectNone('/bp/products/verification/' + 'x'.repeat(11));
  });

  it('cancels obsolete ID checks and reports a verification failure', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    setValue(root, '#product-id', 'first');
    await new Promise((resolve) => setTimeout(resolve, 350));
    const first = http.expectOne('/bp/products/verification/first');

    setValue(root, '#product-id', 'second');
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(first.cancelled).toBe(true);
    http.expectOne('/bp/products/verification/second').error(new ProgressEvent('error'));
    await fixture.whenStable();
    expect(root.querySelector('#product-id-error')?.textContent).toContain('No se pudo verificar');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it('blocks a duplicate ID, then resets model and field state', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    setValue(root, '#product-id', 'taken');
    setValue(root, '#product-name', 'Visa Signature');
    setValue(root, '#product-description', 'Tarjeta de credito');
    setValue(root, '#product-logo', 'https://example.com/visa.png');
    setValue(root, '#date-release', futureRelease());
    await settleIdVerification('taken', true);
    await fixture.whenStable();

    expect(root.querySelector('#product-id-error')?.textContent).toContain('ya existe');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);

    root.querySelector<HTMLButtonElement>('button.secondary')!.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLInputElement>('#product-id')?.value).toBe('');
    expect(root.querySelector<HTMLInputElement>('#product-name')?.value).toBe('');
    expect(root.querySelector<HTMLTextAreaElement>('#product-description')?.value).toBe('');
    expect(root.querySelector<HTMLInputElement>('#product-logo')?.value).toBe('');
    expect(root.querySelector<HTMLInputElement>('#date-release')?.value).toBe('');
    expect(root.querySelector('#product-id-error')).toBeNull();
    expect(TestBed.inject(ProductFormComponentStore).model().dateRevision).toBe('');
  });

  it('rejects an insecure logo URL before creating a product', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    setValue(root, '#product-logo', 'http://example.com/logo.png');
    await fixture.whenStable();

    expect(root.querySelector('#product-logo-error')?.textContent).toContain('HTTPS');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    http.expectNone('/bp/products');
  });

  it('sends the computed revision date and retains values when creation fails', async () => {
    const fixture = TestBed.createComponent(ProductForm);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const release = futureRelease();

    setValue(root, '#product-name', 'Visa Signature');
    setValue(root, '#product-description', 'Tarjeta de crédito de ejemplo');
    setValue(root, '#product-logo', 'https://example.com/visa.jpg');
    setValue(root, '#date-release', release);
    setValue(root, '#product-id', 'visa-001');
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone('/bp/products');
    await settleIdVerification('visa-001', false);
    await fixture.whenStable();

    expect(root.querySelector<HTMLInputElement>('#date-revision')?.value).toBe(
      revisionDateFor(release),
    );
    const submitButton = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submitButton.disabled).toBe(false);

    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    const request = http.expectOne('/bp/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      id: 'visa-001',
      date_release: release,
      date_revision: revisionDateFor(release),
    });
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone('/bp/products');
    request.flush({ message: 'Invalid body' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('datos enviados');
    expect(TestBed.inject(ToastService).notice()).toMatchObject({ kind: 'error' });
    expect(root.querySelector<HTMLInputElement>('#product-id')?.value).toBe('visa-001');

    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    http.expectOne('/bp/products').flush({
      message: 'Product added successfully',
      data: {
        id: 'visa-001',
        name: 'Visa Signature',
        description: 'Tarjeta de crédito de ejemplo',
        logo: 'https://example.com/visa.jpg',
        date_release: release,
        date_revision: revisionDateFor(release),
      },
    });
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products');
    expect(TestBed.inject(ToastService).notice()).toMatchObject({
      kind: 'success',
      message: 'Producto creado correctamente.',
    });
  });
});
