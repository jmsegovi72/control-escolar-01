import { component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { DialogProps } from './dialog.types';
import './dialog.css';

const toneIcon = {
  neutral: 'info',
  danger: 'warning',
  warning: 'warning',
  success: 'success',
} as const;

export const Dialog = component$<DialogProps>(
  ({
    open,
    title,
    description,
    tone = 'neutral',
    size = 'md',
    icon,
    closeLabel = 'Cerrar',
    onClose$,
  }) => {
    if (!open) {
      return null;
    }

    return (
      <section
        class="ui-dialog"
        data-tone={tone}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-dialog-title"
        aria-describedby={description ? 'ui-dialog-description' : undefined}
      >
        <div class="ui-dialog__backdrop" aria-hidden="true" />
        <div class="ui-dialog__surface">
          <header class="ui-dialog__header">
            <span class="ui-dialog__icon" aria-hidden="true">
              <AppIcon intent={icon ?? toneIcon[tone]} size="md" />
            </span>
            <div class="ui-dialog__heading">
              <h2 id="ui-dialog-title">{title}</h2>
              {description && <p id="ui-dialog-description">{description}</p>}
            </div>
            <button
              class="ui-dialog__close"
              type="button"
              aria-label={closeLabel}
              title={closeLabel}
              onClick$={() => onClose$?.()}
            >
              <AppIcon intent="close" size="sm" />
            </button>
          </header>

          <div class="ui-dialog__body">
            <Slot />
          </div>

          <footer class="ui-dialog__footer">
            <Slot name="footer" />
          </footer>
        </div>
      </section>
    );
  },
);
