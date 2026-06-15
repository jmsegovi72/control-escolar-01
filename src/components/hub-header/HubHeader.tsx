import { component$ } from '@builder.io/qwik';
import { AppIcon } from '~/ui/icons';
import './hub-header.css';

export interface HubHeaderMetaItem {
  label: string;
  icon?: Parameters<typeof AppIcon>[0]['intent'];
  tone?: 'default' | 'accent';
}

export interface HubHeaderProps {
  eyebrow: string;
  icon: Parameters<typeof AppIcon>[0]['intent'];
  title: string;
  description: string;
  metaItems?: HubHeaderMetaItem[];
}

export const HubHeader = component$<HubHeaderProps>(
  ({ eyebrow, icon, title, description, metaItems = [] }) => {
    return (
      <header class="hub-header">
        <div class="hub-header__left">
          <div class="hub-header__eyebrow">
            <AppIcon intent={icon} size="sm" />
            <span>{eyebrow}</span>
          </div>

          <h1 class="hub-header__title">{title}</h1>
          <p class="hub-header__description">{description}</p>

          {metaItems.length > 0 && (
            <div class="hub-header__meta">
              {metaItems.map((item, index) => (
                <span
                  key={index}
                  class={`hub-header__pill${item.tone === 'accent' ? ' hub-header__pill--accent' : ''}`}
                >
                  {item.icon && <AppIcon intent={item.icon} size="sm" />}
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
    );
  },
);
