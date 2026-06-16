import { component$, Slot } from '@builder.io/qwik';

import type { FieldProps } from './field.types';
import './field.css';

export const Field = component$<FieldProps>(
  ({
    label,
    hint,
    error,
    required,
    optional,
    disabled,
    htmlFor,
    variant = 'default',
  }) => {
    return (
      <label
        class="ui-field"
        data-variant={variant}
        data-invalid={error ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        for={htmlFor}
      >
        <span
          class="ui-field__label"
          data-required={required ? 'true' : undefined}
        >
          {label}
          {required && (
            <span class="ui-field__required" aria-label="requerido">
              *
            </span>
          )}
          {!required && optional && (
            <span class="ui-field__meta"> Opcional</span>
          )}
        </span>
        <Slot />
        <span
          class="ui-field__message"
          role={error ? 'alert' : undefined}
          aria-live={error ? 'polite' : undefined}
          data-empty={!error && !hint ? 'true' : undefined}
        >
          {error || hint}
        </span>
      </label>
    );
  },
);
