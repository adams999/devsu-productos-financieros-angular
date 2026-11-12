import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { catchApiErrors } from '@app/core/http/api-error';
import type { ApiErrorMessages } from '@app/core/http/api-error';
import { productToCreateRequest, productToUpdateRequest } from './product-mapper';
import type { Product } from '../models/products.models';
import type {
  ProductDeletePort,
  ProductFormPort,
  ProductIdVerifier,
  ProductListPort,
} from '../ports/product-ports';
import {
  readCreatedProduct,
  readIdTaken,
  readProduct,
  readProductsResponse,
  readUpdatedProduct,
} from './product-codec';

const PRODUCT_ERROR_MESSAGES: ApiErrorMessages = {
  network: 'No se pudo conectar con el servicio. Inténtalo de nuevo.',
  invalid: 'Los datos enviados no son válidos. Revísalos e inténtalo de nuevo.',
  notFound: 'El producto solicitado ya no existe.',
  server: 'No se pudo completar la operación. Inténtalo de nuevo.',
};

@Injectable({ providedIn: 'root' })
export class ProductsApi
  implements ProductListPort, ProductDeletePort, ProductFormPort, ProductIdVerifier
{
  private readonly http = inject(HttpClient);
  private readonly url = '/bp/products';

  list(): Observable<readonly Product[]> {
    return this.http
      .get<unknown>(this.url)
      .pipe(map(readProductsResponse), catchApiErrors(PRODUCT_ERROR_MESSAGES));
  }

  get(id: string): Observable<Product> {
    return this.http
      .get<unknown>(this.productUrl(id))
      .pipe(map(readProduct), catchApiErrors(PRODUCT_ERROR_MESSAGES));
  }

  create(product: Product): Observable<Product> {
    return this.http
      .post<unknown>(this.url, productToCreateRequest(product))
      .pipe(map(readCreatedProduct), catchApiErrors(PRODUCT_ERROR_MESSAGES));
  }

  update(product: Product): Observable<Product> {
    return this.http
      .put<unknown>(this.productUrl(product.id), productToUpdateRequest(product))
      .pipe(
        map((response) => readUpdatedProduct(response, product.id)),
        catchApiErrors(PRODUCT_ERROR_MESSAGES),
      );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<unknown>(this.productUrl(id)).pipe(
      map(() => undefined),
      catchApiErrors(PRODUCT_ERROR_MESSAGES),
    );
  }

  isIdTaken(id: string): Observable<boolean> {
    return this.http
      .get<unknown>(`${this.url}/verification/${encodeURIComponent(id)}`)
      .pipe(map(readIdTaken), catchApiErrors(PRODUCT_ERROR_MESSAGES));
  }

  private productUrl(id: string): string {
    return `${this.url}/${encodeURIComponent(id)}`;
  }
}
