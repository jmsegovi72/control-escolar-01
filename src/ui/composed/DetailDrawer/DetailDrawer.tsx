import { $, component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { DetailDrawerProps } from './detail-drawer.types';
import './detail-drawer.css';

const toneIcon = {
  neutral: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
} as const;

export const DetailDrawer = component$<DetailDrawerProps>(
  ({
    open,
    title,
    description,
    meta,
    icon,
    tone = 'neutral',
    size = 'md',
    placement = 'right',
    presentation = 'overlay',
    closeLabel = 'Cerrar panel',
    onClose$,
  }) => {
    if (!open) {
      return null;
    }

    return (
      <section
        class="ui-detail-drawer"
        data-tone={tone}
        data-size={size}
        data-placement={placement}
        data-presentation={presentation}
        role="dialog"
        aria-modal={presentation === 'overlay' ? 'true' : undefined}
        aria-labelledby="ui-detail-drawer-title"
        aria-describedby={
          description ? 'ui-detail-drawer-description' : undefined
        }
        document:onKeydown$={$((event) => {
          if ((event as KeyboardEvent).key === 'Escape') {
            onClose$?.();
          }
        })}
      >
        {presentation === 'overlay' && (
          <button
            class="ui-detail-drawer__backdrop"
            type="button"
            aria-label={closeLabel}
            onClick$={() => onClose$?.()}
          />
        )}

        <aside class="ui-detail-drawer__surface">
          <header class="ui-detail-drawer__header">
            <span class="ui-detail-drawer__icon" aria-hidden="true">
              <AppIcon intent={icon ?? toneIcon[tone]} size="md" />
            </span>
            <div class="ui-detail-drawer__heading">
              <span class="ui-detail-drawer__meta">{meta}</span>
              <h2 id="ui-detail-drawer-title">{title}</h2>
              {description && (
                <p id="ui-detail-drawer-description">{description}</p>
              )}
            </div>
            <div class="ui-detail-drawer__actions">
              <Slot name="actions" />
              <button
                class="ui-detail-drawer__close"
                type="button"
                aria-label={closeLabel}
                title={closeLabel}
                onClick$={() => onClose$?.()}
              >
                <AppIcon intent="close" size="sm" />
              </button>
            </div>
          </header>

          <div class="ui-detail-drawer__body">
            <Slot />
          </div>

          <footer class="ui-detail-drawer__footer">
            <Slot name="footer" />
          </footer>
        </aside>
      </section>
    );
  },
);
