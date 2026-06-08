import { $, component$, useSignal } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { DropdownMenuProps } from './dropdown-menu.types';
import './dropdown-menu.css';

export const DropdownMenu = component$<DropdownMenuProps>(
  ({ label, items, icon, align = 'end', size = 'md', disabled }) => {
    const isOpen = useSignal(false);
    const menuRef = useSignal<HTMLElement>();

    return (
      <div
        ref={menuRef}
        class="ui-dropdown-menu"
        data-align={align}
        data-size={size}
        data-open={isOpen.value ? 'true' : undefined}
        document:onClick$={$((event) => {
          const target = event.target as HTMLElement;

          if (menuRef.value?.contains(target)) {
            return;
          }

          isOpen.value = false;
        })}
        document:onKeydown$={$((event) => {
          if ((event as KeyboardEvent).key === 'Escape') {
            isOpen.value = false;
          }
        })}
      >
        <button
          class="ui-dropdown-menu__trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen.value ? 'true' : 'false'}
          disabled={disabled}
          onClick$={() => {
            isOpen.value = !isOpen.value;
          }}
        >
          {icon && (
            <span class="ui-dropdown-menu__trigger-icon" aria-hidden="true">
              <AppIcon intent={icon} size="sm" />
            </span>
          )}
          <span class="ui-dropdown-menu__trigger-label">{label}</span>
          <span class="ui-dropdown-menu__trigger-caret" aria-hidden="true">
            <AppIcon intent="chevron-down" size="xs" />
          </span>
        </button>

        {isOpen.value && (
          <div class="ui-dropdown-menu__content" role="menu">
            {items.map((item) => {
              if (item.type === 'separator') {
                return (
                  <span
                    key={item.id}
                    class="ui-dropdown-menu__separator"
                    role="separator"
                  />
                );
              }

              if (item.type === 'label') {
                return (
                  <span key={item.id} class="ui-dropdown-menu__label">
                    {item.label}
                  </span>
                );
              }

              return (
                <button
                  key={item.id}
                  class="ui-dropdown-menu__item"
                  type="button"
                  role="menuitem"
                  data-tone={item.tone}
                  disabled={item.disabled}
                  onClick$={async () => {
                    if (item.disabled) {
                      return;
                    }

                    await item.onSelect$?.();
                    isOpen.value = false;
                  }}
                >
                  {item.icon && (
                    <span
                      class="ui-dropdown-menu__item-icon"
                      aria-hidden="true"
                    >
                      <AppIcon intent={item.icon} size="sm" />
                    </span>
                  )}
                  <span class="ui-dropdown-menu__item-label">{item.label}</span>
                  {item.shortcut && (
                    <span class="ui-dropdown-menu__shortcut">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);
