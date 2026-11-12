import type { Signal, WritableSignal } from '@angular/core';
import {
  disabled,
  form,
  maxLength,
  minLength,
  readonly as readOnly,
  required,
  validate,
} from '@angular/forms/signals';
import { safeImageUrl } from '@app/shared/utils/safe-image-url';
import { isDateOnly, revisionDateFor } from '../models/product-dates';
import { PRODUCT_FIELD_LENGTHS } from '../models/product-validation';
import type { IdVerification } from '../models/product-validation';
import type { ProductFormValue } from '../models/products.models';

interface ProductFormRulesContext {
  readonly isEdit: boolean;
  readonly idVerification: Signal<IdVerification>;
  readonly today: () => string;
}

export function createProductForm(
  model: WritableSignal<ProductFormValue>,
  context: ProductFormRulesContext,
) {
  return form(model, (path) => {
    required(path.id, { message: 'El ID es obligatorio.' });
    minLength(path.id, PRODUCT_FIELD_LENGTHS.id.min, {
      message: `El ID debe tener al menos ${PRODUCT_FIELD_LENGTHS.id.min} caracteres.`,
    });
    maxLength(path.id, PRODUCT_FIELD_LENGTHS.id.max, {
      message: `El ID debe tener máximo ${PRODUCT_FIELD_LENGTHS.id.max} caracteres.`,
    });
    validate(path.id, ({ value }) =>
      value().trim() ? undefined : { kind: 'blank', message: 'El ID es obligatorio.' },
    );
    disabled(path.id, () => context.isEdit);
    validate(path.id, ({ value }) => {
      const verification = context.idVerification();
      if (context.isEdit || verification.id !== value()) return undefined;
      if (verification.status === 'taken') {
        return { kind: 'duplicate', message: 'Este ID ya existe.' };
      }
      if (verification.status === 'error') {
        return { kind: 'verification', message: 'No se pudo verificar el ID. Inténtalo de nuevo.' };
      }
      return undefined;
    });

    required(path.name, { message: 'El nombre es obligatorio.' });
    minLength(path.name, PRODUCT_FIELD_LENGTHS.name.min, {
      message: `El nombre debe tener al menos ${PRODUCT_FIELD_LENGTHS.name.min} caracteres.`,
    });
    maxLength(path.name, PRODUCT_FIELD_LENGTHS.name.max, {
      message: `El nombre debe tener máximo ${PRODUCT_FIELD_LENGTHS.name.max} caracteres.`,
    });
    validate(path.name, ({ value }) =>
      value().trim() ? undefined : { kind: 'blank', message: 'El nombre es obligatorio.' },
    );

    required(path.description, { message: 'La descripción es obligatoria.' });
    minLength(path.description, PRODUCT_FIELD_LENGTHS.description.min, {
      message: `La descripción debe tener al menos ${PRODUCT_FIELD_LENGTHS.description.min} caracteres.`,
    });
    maxLength(path.description, PRODUCT_FIELD_LENGTHS.description.max, {
      message: `La descripción debe tener máximo ${PRODUCT_FIELD_LENGTHS.description.max} caracteres.`,
    });
    validate(path.description, ({ value }) =>
      value().trim() ? undefined : { kind: 'blank', message: 'La descripción es obligatoria.' },
    );

    required(path.logo, { message: 'El logo es obligatorio.' });
    validate(path.logo, ({ value }) =>
      value().trim() ? undefined : { kind: 'blank', message: 'El logo es obligatorio.' },
    );
    validate(path.logo, ({ value }) =>
      !value().trim() || safeImageUrl(value())
        ? undefined
        : { kind: 'logoUrl', message: 'Usa una URL HTTPS o una imagen de /assets/.' },
    );

    required(path.dateRelease, { message: 'La fecha de liberación es obligatoria.' });
    validate(path.dateRelease, ({ value }) => {
      const release = value();
      if (!release) return undefined;
      return isDateOnly(release) && release >= context.today()
        ? undefined
        : { kind: 'releaseDate', message: 'La fecha debe ser igual o posterior a hoy.' };
    });

    readOnly(path.dateRevision);
    required(path.dateRevision, { message: 'La fecha de revisión es obligatoria.' });
    validate(path.dateRevision, ({ value, valueOf }) =>
      value() === revisionDateFor(valueOf(path.dateRelease))
        ? undefined
        : {
            kind: 'revisionDate',
            message: 'La revisión debe ser un año después de la liberación.',
          },
    );
  });
}
