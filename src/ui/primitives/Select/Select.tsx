import {
  $,
  component$,
  type Signal,
  useContext,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';

import { DerivedFieldEnabledCtx } from '~/ui/composed/DerivedField/derived-field.context';
import { useFloatingMenu } from '~/ui/hooks/useFloatingMenu';
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
    readOnly,
    required,
    onChange$,
  }) => {
    const { open, anchorRef, toggleFromRef$, leftStyle } = useFloatingMenu();
    const selectedValue = useSignal(value ?? '');

    const fieldEnabled = useContext(DerivedFieldEnabledCtx, null);

    useTask$(({ track }) => {
      const v = track(() => value);
      if (v !== undefined) selectedValue.value = v;
    });

    useTask$(({ track }) => {
      const ctx = fieldEnabled as Signal<boolean> | null;
      if (!ctx) return;
      const isEnabled = track(() => ctx.value);
      if (!isEnabled) open.value = false;
    });

    useVisibleTask$(({ track, cleanup }) => {
      const isOpen = track(() => open.value);
      if (!isOpen) return;

      const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          open.value = false;
        }
      };

      const onMousedown = (e: MouseEvent) => {
        if (anchorRef.value && !anchorRef.value.contains(e.target as Node)) {
          open.value = false;
        }
      };

      document.addEventListener('keydown', onKeydown);
      document.addEventListener('mousedown', onMousedown);

      cleanup(() => {
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('mousedown', onMousedown);
      });
    });

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
        ref={anchorRef}
        class="ui-select-shell"
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        data-readonly={readOnly ? 'true' : undefined}
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
          disabled={disabled || readOnly}
          aria-invalid={invalid ? 'true' : undefined}
          aria-expanded={open.value ? 'true' : 'false'}
          aria-haspopup="listbox"
          onClick$={() => {
            if (!disabled && !readOnly) toggleFromRef$();
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
          <span class="ui-select-menu" role="listbox" style={leftStyle.value}>
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
