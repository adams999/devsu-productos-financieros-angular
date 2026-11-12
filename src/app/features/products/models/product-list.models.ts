export const PRODUCT_PAGE_SIZES = [5, 10, 20] as const;

export type ProductPageSize = (typeof PRODUCT_PAGE_SIZES)[number];

export function isProductPageSize(value: number): value is ProductPageSize {
  return PRODUCT_PAGE_SIZES.some((size) => size === value);
}
