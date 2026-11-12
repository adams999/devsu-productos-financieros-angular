import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Product } from '@products/models/products.models';
import { ProductsTable } from './products-table';

describe('ProductsTable logo handling', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [ProductsTable], providers: [provideRouter([])] }),
  );

  const product: Product = {
    id: 'visa-001',
    name: 'Visa Signature',
    description: 'Tarjeta de crédito de ejemplo',
    logo: 'https://example.com/visa.png',
    dateRelease: '2027-01-01',
    dateRevision: '2028-01-01',
  };

  it('avoids loading an unsafe logo and falls back when an allowed image fails', async () => {
    const fixture = TestBed.createComponent(ProductsTable);
    fixture.componentRef.setInput('products', [
      { ...product, logo: 'http://example.com/tracker.png' },
    ]);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-avatar-image img')).toBeNull();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('VS');

    fixture.componentRef.setInput('products', [product]);
    await fixture.whenStable();
    const image = root.querySelector<HTMLImageElement>('app-avatar-image img')!;
    expect(image.getAttribute('referrerpolicy')).toBe('no-referrer');
    image.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(root.querySelector('app-avatar-image img')).toBeNull();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('VS');
  });
});
