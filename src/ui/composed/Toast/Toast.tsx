import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { ToastProps } from './toast.types';
import './toast.css';

const toneIcon = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
} as const;

export const Toast = component$<ToastProps>(
  ({
    title,
    description,
    tone = 'info',
    icon,
    actionLabel,
    dismissible,
    progress,
    placement = 'inline',
    onAction$,
    onDismiss$,
  }) => {
    const clampedProgress =
      progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

    return (
      <section
        class="ui-toast"
        data-tone={tone}
        data-placement={placement}
        role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      >
        <span class="ui-toast__icon" aria-hidden="true">
          <AppIcon intent={icon ?? toneIcon[tone]} size="sm" />
        </span>

        <div class="ui-toast__content">
          <strong>{title}</strong>
          {description && <p>{description}</p>}
        </div>

        {actionLabel && (
          <button
            class="ui-toast__action"
            type="button"
            onClick$={() => onAction$?.()}
          >
            {actionLabel}
          </button>
        )}

        {dismissible && (
          <button
            class="ui-toast__dismiss"
            type="button"
            aria-label="Cerrar notificacion"
            title="Cerrar notificacion"
            onClick$={() => onDismiss$?.()}
          >
            <AppIcon intent="close" size="xs" />
          </button>
        )}

        {clampedProgress !== undefined && (
          <span class="ui-toast__progress" aria-hidden="true">
            <span style={{ width: `${clampedProgress}%` }} />
          </span>
        )}
      </section>
    );
  },
);
