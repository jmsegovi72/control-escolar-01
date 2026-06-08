import { component$, Slot, useSignal } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { AccordionProps } from './accordion.types';
import './accordion.css';

export const Accordion = component$<AccordionProps>(
  ({
    title,
    description,
    open,
    disabled,
    icon,
    variant = 'default',
    size = 'md',
    tone = 'neutral',
  }) => {
    const isOpen = useSignal(Boolean(open));

    return (
      <section
        class="ui-accordion"
        data-open={isOpen.value ? 'true' : undefined}
        data-variant={variant}
        data-size={size}
        data-tone={tone}
        data-disabled={disabled ? 'true' : undefined}
      >
        <button
          class="ui-accordion__summary"
          type="button"
          aria-expanded={isOpen.value ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : undefined}
          onClick$={() => {
            if (!disabled) {
              isOpen.value = !isOpen.value;
            }
          }}
        >
          {icon && (
            <span class="ui-accordion__icon" aria-hidden="true">
              <AppIcon intent={icon} size="sm" />
            </span>
          )}
          <span class="ui-accordion__heading">
            <span class="ui-accordion__title">{title}</span>
            {description && (
              <span class="ui-accordion__description">{description}</span>
            )}
          </span>
          <span class="ui-accordion__marker" aria-hidden="true">
            <AppIcon intent="chevron-down" size="sm" />
          </span>
        </button>
        <div class="ui-accordion__content-wrap">
          <div class="ui-accordion__content">
            <Slot />
          </div>
        </div>
      </section>
    );
  },
);
