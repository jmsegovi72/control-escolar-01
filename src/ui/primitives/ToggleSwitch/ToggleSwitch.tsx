import { component$, Slot } from '@builder.io/qwik';

import type { ToggleSwitchProps } from './toggle-switch.types';
import './toggle-switch.css';

export const ToggleSwitch = component$<ToggleSwitchProps>(
  ({
    children,
    checked,
    description,
    disabled,
    invalid,
    offLabel = 'Inactivo',
    onLabel = 'Activo',
    showState,
    size = 'md',
    ...props
  }) => {
    void children;

    return (
      <label
        class="ui-toggle-switch"
        data-disabled={disabled ? 'true' : undefined}
        data-invalid={invalid ? 'true' : undefined}
        data-size={size}
      >
        <input
          {...props}
          aria-invalid={invalid ? 'true' : undefined}
          checked={checked}
          disabled={disabled}
          type="checkbox"
        />
        <span class="ui-toggle-switch__control" aria-hidden="true" />
        <span class="ui-toggle-switch__copy">
          <span class="ui-toggle-switch__label-row">
            <span class="ui-toggle-switch__label">
              <Slot />
            </span>
            {showState && (
              <span class="ui-toggle-switch__state">
                {checked ? onLabel : offLabel}
              </span>
            )}
          </span>
          {description && (
            <span class="ui-toggle-switch__description">{description}</span>
          )}
        </span>
      </label>
    );
  },
);
