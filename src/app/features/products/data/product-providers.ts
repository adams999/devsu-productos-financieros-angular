import type { Provider } from '@angular/core';
import {
  PRODUCT_DELETE_PORT,
  PRODUCT_FORM_PORT,
  PRODUCT_ID_VERIFIER,
  PRODUCT_LIST_PORT,
} from '../ports/product-ports';
import { ProductsApi } from './products-api';

export const PRODUCT_DATA_PROVIDERS: Provider[] = [
  { provide: PRODUCT_LIST_PORT, useExisting: ProductsApi },
  { provide: PRODUCT_DELETE_PORT, useExisting: ProductsApi },
  { provide: PRODUCT_FORM_PORT, useExisting: ProductsApi },
  { provide: PRODUCT_ID_VERIFIER, useExisting: ProductsApi },
];
