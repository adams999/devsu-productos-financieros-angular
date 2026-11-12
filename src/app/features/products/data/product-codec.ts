import { invalidApiResponse } from '@app/core/http/api-error';
import { isRecord, readApiData } from '@app/core/http/api-response';
import { isDateOnly } from '../models/product-dates';
import type { Product } from '../models/products.models';
import { productFromDto } from './product-mapper';
import type { ProductDto } from './product-mapper';

function isProductDto(value: unknown): value is ProductDto {
  if (!isRecord(value)) return false;
  return (
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    typeof value['name'] === 'string' &&
    typeof value['description'] === 'string' &&
    typeof value['logo'] === 'string' &&
    typeof value['date_release'] === 'string' &&
    isDateOnly(value['date_release']) &&
    typeof value['date_revision'] === 'string' &&
    isDateOnly(value['date_revision'])
  );
}

export function readProduct(value: unknown): Product {
  if (!isProductDto(value)) throw invalidApiResponse();
  return productFromDto(value);
}

export function readProductsResponse(value: unknown): readonly Product[] {
  return readApiData(value, (data) => {
    if (!Array.isArray(data)) throw invalidApiResponse();
    return data.map(readProduct);
  });
}

export function readCreatedProduct(value: unknown): Product {
  return readApiData(value, readProduct);
}

export function readUpdatedProduct(value: unknown, id: string): Product {
  return readApiData(value, (data) => {
    if (!isRecord(data)) throw invalidApiResponse();
    return readProduct({ ...data, id });
  });
}

export function readIdTaken(value: unknown): boolean {
  if (typeof value !== 'boolean') throw invalidApiResponse();
  return value;
}
