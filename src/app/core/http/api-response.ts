import { invalidApiResponse } from './api-error';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readApiData<T>(value: unknown, decode: (data: unknown) => T): T {
  if (!isRecord(value)) throw invalidApiResponse();
  return decode(value['data']);
}
