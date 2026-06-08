import { component$ } from '@builder.io/qwik';

import type { RadioGroupProps } from './radio-group.types';
import './radio-group.css';

export const RadioGroup = component$<RadioGroupProps>(
  ({
    options,
    value,
    name,
    size = 'md',
    direction = 'column',
    disabled,
    required,
    invalid,
    onChange$,
  }) => {
    return (
      <div
        class="ui-radio-group"
        data-size={size}
        data-direction={direction}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        role="radiogroup"
      >
        {options.map((option) => (
          <label
            key={option.value}
            class="ui-radio"
            data-disabled={disabled || option.disabled ? 'true' : undefined}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={disabled || option.disabled}
              required={required}
              aria-invalid={invalid ? 'true' : undefined}
              onChange$={() => onChange$?.(option.value)}
            />
            <span class="ui-radio__mark" aria-hidden="true" />
            <span class="ui-radio__content">
              <span class="ui-radio__label">{option.label}</span>
              {option.description && (
                <span class="ui-radio__description">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    );
  },
);
