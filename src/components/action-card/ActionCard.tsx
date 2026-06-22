import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { AppIcon } from '~/ui/icons';
import './action-card.css';

export type ActionCardTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'violet'
  | 'gray';

export interface ActionCardProps {
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: ActionCardTone;
  title: string;
  description: string;
  badge?: string;
  href: string;
  disabled?: boolean;
  actionLabel: string;
}

export const ActionCard = component$<ActionCardProps>(
  ({
    icon,
    tone,
    title,
    description,
    badge,
    href,
    disabled = false,
    actionLabel,
  }) => {
    const nav = useNavigate();

    return (
      <article
        class={`ui-action-card ui-action-card--${tone}${disabled ? ' ui-action-card--disabled' : ''}`}
      >
        <div class="ui-action-card__top">
          <div class={`ui-action-card__icon ui-action-card__icon--${tone}`}>
            <AppIcon intent={icon} size="lg" />
          </div>

          {badge && <span class="ui-action-card__badge">{badge}</span>}
        </div>

        <div class="ui-action-card__body">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <footer class="ui-action-card__footer">
          <span class="ui-action-card__path">{href}</span>
          <button
            type="button"
            class={`ui-action-card__button ui-action-card__button--${tone}`}
            disabled={disabled}
            onClick$={async () => {
              if (!disabled) {
                await nav(href);
              }
            }}
          >
            {actionLabel}
            <AppIcon intent="chevron-right" size="sm" />
          </button>
        </footer>
      </article>
    );
  },
);
