import { component$ } from '@builder.io/qwik';

import { DateInput } from '~/ui/primitives/DateInput/DateInput';
import type { DateRangeInputProps } from './date-range-input.types';
import './date-range-input.css';

export const DateRangeInput = component$<DateRangeInputProps>(
  ({
    startValue,
    endValue,
    startLabel = 'Desde',
    endLabel = 'Hasta',
    startName,
    endName,
    min,
    max,
    variant = 'line',
    size = 'md',
    disabled,
    invalid,
    required,
    hint,
    error,
  }) => {
    return (
      <div
        class="ui-date-range"
        data-invalid={invalid || error ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <div class="ui-date-range__fields">
          <label class="ui-date-range__field">
            <span>{startLabel}</span>
            <DateInput
              name={startName}
              value={startValue}
              min={min}
              max={max}
              variant={variant}
              size={size}
              disabled={disabled}
              invalid={invalid || Boolean(error)}
              required={required}
            />
          </label>

          <label class="ui-date-range__field">
            <span>{endLabel}</span>
            <DateInput
              name={endName}
              value={endValue}
              min={min}
              max={max}
              variant={variant}
              size={size}
              disabled={disabled}
              invalid={invalid || Boolean(error)}
              required={required}
            />
          </label>
        </div>

        {(error || hint) && (
          <span
            class="ui-date-range__message"
            role={error ? 'alert' : undefined}
          >
            {error ?? hint}
          </span>
        )}
      </div>
    );
  },
);
