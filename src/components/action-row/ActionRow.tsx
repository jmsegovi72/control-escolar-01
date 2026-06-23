import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { AppIcon } from '~/ui/icons';
import './action-row.css';

export type ActionRowTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'violet'
  | 'teal'
  | 'slate'
  | 'info'
  | 'gray';

export interface ActionRowProps {
  icon: Parameters<typeof AppIcon>[0]['intent'];
  tone: ActionRowTone;
  title: string;
  description: string;
  badge?: string;
  href: string;
  disabled?: boolean;
  actionLabel: string;
}

export const ActionRow = component$<ActionRowProps>(
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
        class={`ui-action-row${disabled ? ' ui-action-row--disabled' : ''}`}
      >
        <div class={`ui-action-row__icon ui-action-row__icon--${tone}`}>
          <AppIcon intent={icon} size="md" />
        </div>

        <div class="ui-action-row__body">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <div class="ui-action-row__right">
          {badge && <span class="ui-action-row__badge">{badge}</span>}

          <button
            type="button"
            class="ui-action-row__button"
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
        </div>
      </article>
    );
  },
);
