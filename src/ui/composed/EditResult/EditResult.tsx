import { component$, Slot } from '@builder.io/qwik';
import { AppIcon } from '~/ui/icons';
import { Button } from '~/ui/primitives/Button/Button';
import type { EditResultProps } from './EditResult.types';
import './EditResult.css';

export const EditResult = component$<EditResultProps>(
  ({
    tone = 'success',
    eyebrow,
    title,
    description,
    onRetry$,
    retryLabel,
    class: className,
  }) => {
    return (
      <section
        class={`edit-result ${className ?? ''}`}
        data-tone={tone}
        aria-live="polite"
      >
        <header class="edit-result__header">
          <div class="edit-result__icon" aria-hidden="true">
            <AppIcon
              intent={tone === 'success' ? 'check' : 'close'}
              size="lg"
            />
          </div>
          <span class="edit-result__eyebrow">{eyebrow}</span>
          <h2 class="edit-result__title">{title}</h2>
          {description && <p class="edit-result__description">{description}</p>}
        </header>

        <div class="edit-result__body">
          <Slot />
        </div>

        <div class="edit-result__actions">
          {tone === 'error' && onRetry$ && (
            <Button onClick$={onRetry$}>{retryLabel ?? 'Reintentar'}</Button>
          )}
          <Slot name="actions" />
        </div>
      </section>
    );
  },
);
