import { component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { PanelProps } from './panel.types';
import './panel.css';

export const Panel = component$<PanelProps>(
  ({
    title,
    eyebrow,
    description,
    icon,
    variant = 'default',
    density = 'comfortable',
  }) => {
    return (
      <section class="ui-panel" data-variant={variant} data-density={density}>
        {(eyebrow || title || description || icon) && (
          <header class="ui-panel__header">
            <Slot name="leading" />
            <div class="ui-panel__heading">
              {icon && (
                <div class="ui-panel__icon" aria-hidden="true">
                  <AppIcon intent={icon} size="sm" />
                </div>
              )}
              {eyebrow && <span class="ui-panel__eyebrow">{eyebrow}</span>}
              {title && <h2 class="ui-panel__title">{title}</h2>}
              {description && (
                <p class="ui-panel__description">{description}</p>
              )}
            </div>
            <div class="ui-panel__actions">
              <Slot name="actions" />
            </div>
          </header>
        )}
        <div class="ui-panel__body">
          <Slot />
        </div>
      </section>
    );
  },
);
