import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import { Button } from '~/ui/primitives/Button/Button';
import type { EmptyStateProps } from './empty-state.types';
import './empty-state.css';

const toneIcon = {
  neutral: 'empty',
  info: 'info',
  warning: 'warning',
  danger: 'warning',
} as const;

export const EmptyState = component$<EmptyStateProps>(
  ({
    title,
    description,
    icon,
    tone = 'neutral',
    size = 'md',
    actionLabel,
    secondaryActionLabel,
    onAction$,
    onSecondaryAction$,
  }) => {
    return (
      <section class="ui-empty-state" data-tone={tone} data-size={size}>
        <span class="ui-empty-state__icon" aria-hidden="true">
          <AppIcon
            intent={icon ?? toneIcon[tone]}
            size={size === 'lg' ? 'lg' : 'md'}
          />
        </span>

        <div class="ui-empty-state__copy">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>

        {(actionLabel || secondaryActionLabel) && (
          <div class="ui-empty-state__actions">
            {secondaryActionLabel && (
              <Button
                variant="secondary"
                onClick$={() => onSecondaryAction$?.()}
              >
                {secondaryActionLabel}
              </Button>
            )}
            {actionLabel && (
              <Button iconLeft="add" onClick$={() => onAction$?.()}>
                {actionLabel}
              </Button>
            )}
          </div>
        )}
      </section>
    );
  },
);
