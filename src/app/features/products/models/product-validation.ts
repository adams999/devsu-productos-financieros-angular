export const PRODUCT_FIELD_LENGTHS = {
  id: { min: 3, max: 10 },
  name: { min: 6, max: 100 },
  description: { min: 10, max: 200 },
} as const;

export type IdVerificationStatus = 'idle' | 'pending' | 'available' | 'taken' | 'error';

export interface IdVerification {
  readonly id: string;
  readonly status: IdVerificationStatus;
}

export function isValidProductIdCandidate(id: string): boolean {
  return (
    id.length >= PRODUCT_FIELD_LENGTHS.id.min &&
    id.length <= PRODUCT_FIELD_LENGTHS.id.max &&
    !!id.trim()
  );
}
