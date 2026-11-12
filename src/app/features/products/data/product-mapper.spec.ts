import { productFromDto, productToCreateRequest, productToUpdateRequest } from './product-mapper';
import type { ProductDto } from './product-mapper';

describe('product API mapping', () => {
  const dto: ProductDto = {
    id: 'visa-001',
    name: 'Visa Signature',
    description: 'Tarjeta de crédito de ejemplo',
    logo: 'https://example.com/visa.jpg',
    date_release: '2024-02-29',
    date_revision: '2025-02-28',
  };

  it('keeps calendar dates unchanged when reading the API response', () => {
    const product = productFromDto(dto);

    expect(product.dateRelease).toBe('2024-02-29');
    expect(product.dateRevision).toBe('2025-02-28');
  });

  it('uses API field names and omits the immutable id on update', () => {
    const product = productFromDto(dto);

    expect(productToCreateRequest(product)).toEqual(dto);
    expect(productToUpdateRequest(product)).toEqual({
      name: dto.name,
      description: dto.description,
      logo: dto.logo,
      date_release: dto.date_release,
      date_revision: dto.date_revision,
    });
  });
});
