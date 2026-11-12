import type { Provider } from '@angular/core';
import { PRODUCT_DATA_PROVIDERS } from './data/product-providers';
import { todayDateOnly } from './models/product-dates';
import { PRODUCT_TODAY } from './ports/product-clock';

export const PRODUCT_PROVIDERS: Provider[] = [
  ...PRODUCT_DATA_PROVIDERS,
  { provide: PRODUCT_TODAY, useValue: todayDateOnly },
];
