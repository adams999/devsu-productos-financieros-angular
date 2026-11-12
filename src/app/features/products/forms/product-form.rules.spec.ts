import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ProductFormValue } from '../models/products.models';
import { createProductForm } from './product-form.rules';

describe('product form rules', () => {
  it('uses the supplied local date to validate the release date', () => {
    const model = signal<ProductFormValue>({
      id: 'future-1',
      name: 'Producto Futuro',
      description: 'Producto de prueba',
      logo: '/assets/logo.png',
      dateRelease: '2098-12-31',
      dateRevision: '2099-12-31',
    });
    const verification = signal({ id: 'future-1', status: 'available' as const });
    const fields = TestBed.runInInjectionContext(() =>
      createProductForm(model, {
        isEdit: false,
        idVerification: verification,
        today: () => '2099-01-01',
      }),
    );

    expect(fields.dateRelease().invalid()).toBe(true);
    model.update((current) => ({
      ...current,
      dateRelease: '2099-01-01',
      dateRevision: '2100-01-01',
    }));
    expect(fields.dateRelease().invalid()).toBe(false);
  });
});
