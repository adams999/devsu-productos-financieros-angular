/** Calendar date in YYYY-MM-DD format, without a timezone. */
export type DateOnly = string;

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly logo: string;
  readonly dateRelease: DateOnly;
  readonly dateRevision: DateOnly;
}

export type ProductFormValue = { -readonly [Field in keyof Product]: Product[Field] };

export function emptyProductFormValue(): ProductFormValue {
  return {
    id: '',
    name: '',
    description: '',
    logo: '',
    dateRelease: '',
    dateRevision: '',
  };
}
