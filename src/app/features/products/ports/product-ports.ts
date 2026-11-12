import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Product } from '../models/products.models';

export interface ProductListPort {
  list(): Observable<readonly Product[]>;
}

export interface ProductDeletePort {
  remove(id: string): Observable<void>;
}

export interface ProductFormPort {
  get(id: string): Observable<Product>;
  create(product: Product): Observable<Product>;
  update(product: Product): Observable<Product>;
}

export interface ProductIdVerifier {
  isIdTaken(id: string): Observable<boolean>;
}

export const PRODUCT_LIST_PORT = new InjectionToken<ProductListPort>('ProductListPort');
export const PRODUCT_DELETE_PORT = new InjectionToken<ProductDeletePort>('ProductDeletePort');
export const PRODUCT_FORM_PORT = new InjectionToken<ProductFormPort>('ProductFormPort');
export const PRODUCT_ID_VERIFIER = new InjectionToken<ProductIdVerifier>('ProductIdVerifier');
