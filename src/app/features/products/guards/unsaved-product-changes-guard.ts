import { CanDeactivateFn } from '@angular/router';
import type { ProductForm } from '../pages/product-form/product-form';

export const unsavedProductChangesGuard: CanDeactivateFn<ProductForm> = (component) =>
  component.canLeave();
