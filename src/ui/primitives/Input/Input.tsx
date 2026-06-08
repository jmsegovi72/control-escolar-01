import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { InputProps } from './input.types';
import './input.css';

export const Input = component$<InputProps>(
  ({
    variant = 'line',
    size = 'md',
    invalid,
    fullWidth = true,
    iconLeft,
    iconRight,
    disabled,
    readOnly,
    ...props
  }) => {
    return (
      <span
        class="ui-input-shell"
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-readonly={readOnly ? 'true' : undefined}
        data-full-width={fullWidth ? 'true' : undefined}
      >
        {iconLeft && (
          <span class="ui-input-shell__icon" aria-hidden="true">
            <AppIcon intent={iconLeft} size="sm" />
          </span>
        )}
        <input
          {...props}
          class="ui-input"
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid ? 'true' : undefined}
        />
        {iconRight && (
          <span class="ui-input-shell__icon" aria-hidden="true">
            <AppIcon intent={iconRight} size="sm" />
          </span>
        )}
      </span>
    );
  },
);
