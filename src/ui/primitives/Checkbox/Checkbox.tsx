import { component$, Slot } from '@builder.io/qwik';

import type { CheckboxProps } from './checkbox.types';
import './checkbox.css';

export const Checkbox = component$<CheckboxProps>(
  ({ children, invalid, size = 'md', disabled, ...props }) => {
    void children;

    return (
      <label
        class="ui-checkbox"
        data-size={size}
        data-invalid={invalid ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <input
          {...props}
          type="checkbox"
          disabled={disabled}
          aria-invalid={invalid ? 'true' : undefined}
        />
        <span class="ui-checkbox__box" aria-hidden="true" />
        <span class="ui-checkbox__label">
          <Slot />
        </span>
      </label>
    );
  },
);
