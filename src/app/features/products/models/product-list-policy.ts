import type { Product } from './products.models';

export function normalizeProductSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function indexProducts(
  products: readonly Product[],
): readonly { product: Product; text: string }[] {
  return products.map((product) => ({
    product,
    text: normalizeProductSearch(`${product.id} ${product.name} ${product.description}`),
  }));
}

export function filterProducts(
  indexed: readonly { product: Product; text: string }[],
  term: string,
): readonly Product[] {
  const query = normalizeProductSearch(term);
  return query
    ? indexed.filter(({ text }) => text.includes(query)).map(({ product }) => product)
    : indexed.map(({ product }) => product);
}

export function pageCountFor(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

export function clampPageIndex(index: number, count: number): number {
  return Math.min(Math.max(0, index), Math.max(0, count - 1));
}

export function visiblePage<T>(items: readonly T[], index: number, size: number): readonly T[] {
  const start = index * size;
  return items.slice(start, start + size);
}
