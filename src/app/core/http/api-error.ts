import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import type { MonoTypeOperatorFunction } from 'rxjs';
import { UserFacingError } from '../errors/user-facing-error';

export type ApiErrorKind = 'network' | 'invalid' | 'notFound' | 'server';
export type ApiErrorMessages = Readonly<Record<ApiErrorKind, string>>;

export class ApiError extends UserFacingError {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function invalidApiResponse(): ApiError {
  return new ApiError('server', 'El servicio devolvió datos inesperados. Inténtalo de nuevo.');
}

function toApiError(error: unknown, messages: ApiErrorMessages): ApiError {
  if (error instanceof ApiError) return error;

  let kind: ApiErrorKind = 'server';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) kind = 'network';
    else if (error.status === 400) kind = 'invalid';
    else if (error.status === 404) kind = 'notFound';
  }

  return new ApiError(kind, messages[kind]);
}

export function catchApiErrors<T>(messages: ApiErrorMessages): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toApiError(error, messages)));
}
