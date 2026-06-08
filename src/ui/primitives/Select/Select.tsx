import { $, component$, useSignal } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { SelectProps } from './select.types';
import './select.css';

export const Select = component$<SelectProps>(
  ({
    options,
    value,
    name,
    placeholder,
    variant = 'line',
    size = 'md',
    invalid,
    fullWidth = true,
    iconLeft,
    disabled,
    required,
    onChange$,
  }) => {
    const open = useSignal(false);
    const selectedValue = useSignal(value ?? '');
    const selectedOption = options.find(
      (option) => option.value === selectedValue.value,
    );

    const selectOption$ = $(async (nextValue: string) => {
      selectedValue.value = nextValue;
      open.value = false;
      await onChange$?.(nextValue);
    });

    return (
      <span
        class="ui-select-shell"
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-full-width={fullWidth ? 'true' : undefined}
        data-open={open.value ? 'true' : undefined}
      >
        {name && (
          <input
            type="hidden"
            name={name}
            value={selectedValue.value}
            required={required}
          />
        )}
        {iconLeft && (
          <span class="ui-select-shell__icon" aria-hidden="true">
            <AppIcon intent={iconLeft} size="sm" />
          </span>
        )}
        <button
          type="button"
          class="ui-select"
          disabled={disabled}
          aria-invalid={invalid ? 'true' : undefined}
          aria-expanded={open.value ? 'true' : 'false'}
          aria-haspopup="listbox"
          onClick$={() => {
            if (!disabled) {
              open.value = !open.value;
            }
          }}
        >
          <span
            class={[
              'ui-select__value',
              !selectedOption ? 'ui-select__value--placeholder' : '',
            ].join(' ')}
          >
            {selectedOption?.label ?? placeholder ?? 'Selecciona...'}
          </span>
        </button>
        <span class="ui-select-shell__chevron" aria-hidden="true">
          <AppIcon intent="chevron-down" size="xs" />
        </span>
        {open.value && (
          <span class="ui-select-menu" role="listbox">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                class="ui-select-option"
                data-selected={
                  option.value === selectedValue.value ? 'true' : undefined
                }
                disabled={option.disabled}
                role="option"
                aria-selected={
                  option.value === selectedValue.value ? 'true' : 'false'
                }
                onClick$={() => selectOption$(option.value)}
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </span>
    );
  },
);
