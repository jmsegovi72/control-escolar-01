import { component$, Slot } from '@builder.io/qwik';
import { AppIcon } from '~/ui/icons';
import { Button } from '~/ui/primitives/Button/Button';
import type { CreateResultProps } from './CreateResult.types';
import './CreateResult.css';

export const CreateResult = component$<CreateResultProps>(
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
        class={`create-result ${className ?? ''}`}
        data-tone={tone}
        aria-live="polite"
      >
        <header class="create-result__header">
          <div class="create-result__icon" aria-hidden="true">
            <AppIcon
              intent={tone === 'success' ? 'check' : 'close'}
              size="lg"
            />
          </div>
          <span class="create-result__eyebrow">{eyebrow}</span>
          <h2 class="create-result__title">{title}</h2>
          {description && (
            <p class="create-result__description">{description}</p>
          )}
        </header>

        <div class="create-result__body">
          <Slot />
        </div>

        <div class="create-result__actions">
          {tone === 'error' && onRetry$ && (
            <Button onClick$={onRetry$}>{retryLabel ?? 'Reintentar'}</Button>
          )}
          <Slot name="actions" />
        </div>
      </section>
    );
  },
);
