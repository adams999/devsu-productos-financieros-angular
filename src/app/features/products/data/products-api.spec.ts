import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@app/core/http/api-error';
import { ProductsApi } from './products-api';
import type { Product } from '../models/products.models';
import type { ProductDto } from './product-mapper';

describe('ProductsApi', () => {
  let api: ProductsApi;
  let http: HttpTestingController;

  const dto: ProductDto = {
    id: 'visa/001',
    name: 'Visa Signature',
    description: 'Tarjeta de crédito de ejemplo',
    logo: 'https://example.com/visa.jpg',
    date_release: '2026-12-01',
    date_revision: '2027-12-01',
  };
  const product: Product = {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    logo: dto.logo,
    dateRelease: dto.date_release,
    dateRevision: dto.date_revision,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists products and maps calendar dates without timezone conversion', () => {
    let result: readonly Product[] | undefined;
    api.list().subscribe((value) => (result = value));

    const request = http.expectOne('/bp/products');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [dto] });

    expect(result).toEqual([product]);
  });

  it('gets one product with an encoded ID', () => {
    let result: Product | undefined;
    api.get(dto.id).subscribe((value) => (result = value));

    const request = http.expectOne('/bp/products/visa%2F001');
    expect(request.request.method).toBe('GET');
    request.flush(dto);

    expect(result).toEqual(product);
  });

  it('creates a product using the API field names', () => {
    let result: Product | undefined;
    api.create(product).subscribe((value) => (result = value));

    const request = http.expectOne('/bp/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    request.flush({ message: 'Product added successfully', data: dto });

    expect(result).toEqual(product);
  });

  it('updates by path ID without sending ID in the body', () => {
    let result: Product | undefined;
    api.update(product).subscribe((value) => (result = value));

    const request = http.expectOne('/bp/products/visa%2F001');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      date_release: dto.date_release,
      date_revision: dto.date_revision,
    });
    request.flush({ message: 'Product updated successfully', data: request.request.body });

    expect(result).toEqual(product);
  });

  it('deletes by encoded ID and verifies availability using a boolean response', () => {
    let removed = false;
    let taken: boolean | undefined;
    api.remove(dto.id).subscribe(() => (removed = true));
    const deleteRequest = http.expectOne('/bp/products/visa%2F001');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ message: 'Product removed successfully' });

    api.isIdTaken(dto.id).subscribe((value) => (taken = value));
    const verificationRequest = http.expectOne('/bp/products/verification/visa%2F001');
    expect(verificationRequest.request.method).toBe('GET');
    verificationRequest.flush(false);

    expect(removed).toBe(true);
    expect(taken).toBe(false);
  });

  it.each([
    [400, 'invalid', 'Los datos enviados no son válidos. Revísalos e inténtalo de nuevo.'],
    [404, 'notFound', 'El producto solicitado ya no existe.'],
    [500, 'server', 'No se pudo completar la operación. Inténtalo de nuevo.'],
  ] as const)('maps HTTP %i to a safe %s error', (status, kind, message) => {
    let error: unknown;
    api.get('missing').subscribe({ error: (value: unknown) => (error = value) });
    http
      .expectOne('/bp/products/missing')
      .flush({ stack: 'private server trace' }, { status, statusText: 'Error' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind, message });
    expect(String(error)).not.toContain('private server trace');
  });

  it('maps a connection failure to a friendly network error', () => {
    let error: unknown;
    api.list().subscribe({ error: (value: unknown) => (error = value) });
    http.expectOne('/bp/products').error(new ProgressEvent('error'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network' });
  });

  it('rejects malformed product data without exposing the response or breaking the list', () => {
    let error: unknown;
    api.list().subscribe({ error: (value: unknown) => (error = value) });
    http.expectOne('/bp/products').flush({
      data: [{ ...dto, name: null, privateTrace: 'internal database path' }],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'server' });
    expect(String(error)).not.toContain('internal database path');
  });

  it('rejects a non-boolean ID verification response', () => {
    let error: unknown;
    api.isIdTaken('visa-001').subscribe({ error: (value: unknown) => (error = value) });
    http.expectOne('/bp/products/verification/visa-001').flush({ exists: false });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'server' });
  });

  it('preserves both boolean verification outcomes for an encoded ID', () => {
    const outcomes: boolean[] = [];
    api.isIdTaken(dto.id).subscribe((value) => outcomes.push(value));
    const taken = http.expectOne('/bp/products/verification/visa%2F001');
    expect(taken.request.method).toBe('GET');
    taken.flush(true);

    api.isIdTaken(dto.id).subscribe((value) => outcomes.push(value));
    http.expectOne('/bp/products/verification/visa%2F001').flush(false);
    expect(outcomes).toEqual([true, false]);
  });

  it.each(['get', 'create', 'update'] as const)(
    'rejects a malformed %s product response instead of exposing untrusted data',
    (operation) => {
      let error: unknown;
      if (operation === 'get')
        api.get(dto.id).subscribe({ error: (value: unknown) => (error = value) });
      if (operation === 'create')
        api.create(product).subscribe({ error: (value: unknown) => (error = value) });
      if (operation === 'update')
        api.update(product).subscribe({ error: (value: unknown) => (error = value) });

      const request = http.expectOne(
        operation === 'create' ? '/bp/products' : '/bp/products/visa%2F001',
      );
      request.flush(
        operation === 'get'
          ? { ...dto, date_release: '2026-02-31', privateTrace: 'secret' }
          : { data: { ...dto, logo: null, privateTrace: 'secret' } },
      );

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ kind: 'server' });
      expect(String(error)).not.toContain('secret');
    },
  );

  it.each([
    ['create', 400, 'invalid'],
    ['update', 404, 'notFound'],
    ['remove', 404, 'notFound'],
    ['verify', 0, 'network'],
  ] as const)('maps %s HTTP %i to %s without a real server', (operation, status, kind) => {
    let error: unknown;
    if (operation === 'create')
      api.create(product).subscribe({ error: (value: unknown) => (error = value) });
    if (operation === 'update')
      api.update(product).subscribe({ error: (value: unknown) => (error = value) });
    if (operation === 'remove')
      api.remove(dto.id).subscribe({ error: (value: unknown) => (error = value) });
    if (operation === 'verify')
      api.isIdTaken(dto.id).subscribe({ error: (value: unknown) => (error = value) });

    const url =
      operation === 'create'
        ? '/bp/products'
        : operation === 'verify'
          ? '/bp/products/verification/visa%2F001'
          : '/bp/products/visa%2F001';
    const request = http.expectOne(url);
    expect(request.request.method).toBe(
      { create: 'POST', update: 'PUT', remove: 'DELETE', verify: 'GET' }[operation],
    );
    if (status === 0) request.error(new ProgressEvent('error'));
    else request.flush({ privateTrace: 'secret' }, { status, statusText: 'Error' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind });
    expect(String(error)).not.toContain('secret');
  });
});
