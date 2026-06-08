import { component$, Slot } from '@builder.io/qwik';

import type { PanelProps } from './panel.types';
import './panel.css';

export const Panel = component$<PanelProps>(
  ({
    title,
    eyebrow,
    description,
    variant = 'default',
    density = 'comfortable',
  }) => {
    return (
      <section class="ui-panel" data-variant={variant} data-density={density}>
        {(eyebrow || title || description) && (
          <header class="ui-panel__header">
            <div class="ui-panel__heading">
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
