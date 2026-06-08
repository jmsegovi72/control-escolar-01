import { component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { TabsProps } from './tabs.types';
import './tabs.css';

export const Tabs = component$<TabsProps>(
  ({
    items,
    activeTab,
    variant = 'line',
    size = 'md',
    orientation = 'horizontal',
    fullWidth,
  }) => {
    return (
      <section
        class="ui-tabs"
        data-variant={variant}
        data-size={size}
        data-orientation={orientation}
        data-full-width={fullWidth ? 'true' : undefined}
      >
        <div
          class="ui-tabs__list"
          role="tablist"
          aria-orientation={orientation}
        >
          {items.map((item) => {
            const isActive = item.id === activeTab;

            return (
              <button
                key={item.id}
                class="ui-tabs__trigger"
                type="button"
                role="tab"
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
                data-active={isActive ? 'true' : undefined}
                disabled={item.disabled}
              >
                {item.icon && (
                  <span class="ui-tabs__icon" aria-hidden="true">
                    <AppIcon intent={item.icon} size="sm" />
                  </span>
                )}
                <span class="ui-tabs__label">{item.label}</span>
                {item.badge !== undefined && (
                  <span class="ui-tabs__badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div
          class="ui-tabs__panel"
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          <Slot />
        </div>
      </section>
    );
  },
);
