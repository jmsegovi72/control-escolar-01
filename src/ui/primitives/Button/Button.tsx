import { component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { ButtonProps } from './button.types';
import './button.css';

export const Button = component$<ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    fullWidth,
    active,
    iconLeft,
    iconRight,
    ...props
  }) => {
    return (
      <button
        {...props}
        class="ui-button"
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth ? 'true' : undefined}
        data-loading={loading ? 'true' : undefined}
        data-active={active ? 'true' : undefined}
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : undefined}
      >
        {loading ? (
          <span class="ui-button__spinner" aria-hidden="true" />
        ) : (
          iconLeft && <AppIcon intent={iconLeft} size="sm" />
        )}
        <Slot />
        {!loading && iconRight && <AppIcon intent={iconRight} size="sm" />}
      </button>
    );
  },
);
