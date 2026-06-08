import { component$ } from '@builder.io/qwik';

import type { ChoiceGroupProps } from './choice-group.types';
import './choice-group.css';

export const ChoiceGroup = component$<ChoiceGroupProps>(
  ({
    options,
    value,
    name,
    size = 'md',
    direction = 'row',
    disabled,
    required,
    invalid,
    onChange$,
  }) => {
    return (
      <div
        class="ui-choice-group"
        data-size={size}
        data-direction={direction}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        role="radiogroup"
      >
        {options.map((option) => (
          <label
            key={option.value}
            class="ui-choice"
            data-selected={option.value === value ? 'true' : undefined}
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
            <span class="ui-choice__content">
              <span class="ui-choice__label">{option.label}</span>
              {option.description && (
                <span class="ui-choice__description">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    );
  },
);
