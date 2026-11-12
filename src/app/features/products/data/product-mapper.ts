import type { DateOnly, Product } from '../models/products.models';

export interface ProductDto extends Pick<Product, 'id' | 'name' | 'description' | 'logo'> {
  readonly date_release: DateOnly;
  readonly date_revision: DateOnly;
}

export type CreateProductRequest = ProductDto;
export type UpdateProductRequest = Omit<ProductDto, 'id'>;

export function productFromDto(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    logo: dto.logo,
    dateRelease: dto.date_release,
    dateRevision: dto.date_revision,
  };
}

export function productToCreateRequest(product: Product): CreateProductRequest {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    logo: product.logo,
    date_release: product.dateRelease,
    date_revision: product.dateRevision,
  };
}

export function productToUpdateRequest(product: Product): UpdateProductRequest {
  return {
    name: product.name,
    description: product.description,
    logo: product.logo,
    date_release: product.dateRelease,
    date_revision: product.dateRevision,
  };
}
