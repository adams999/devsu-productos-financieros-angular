import { InjectionToken } from '@angular/core';
import type { DateOnly } from '../models/products.models';

export const PRODUCT_TODAY = new InjectionToken<() => DateOnly>('ProductToday');
