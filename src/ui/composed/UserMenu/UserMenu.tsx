import { $, component$, useSignal } from '@builder.io/qwik';

import { Avatar } from '~/ui/primitives/Avatar/Avatar';
import { AppIcon } from '~/ui/icons';
import type { UserMenuProps } from './user-menu.types';
import './user-menu.css';

export const UserMenu = component$<UserMenuProps>(
  ({
    user,
    actions,
    size = 'md',
    align = 'end',
    compact,
    disabled,
    sessionLabel,
  }) => {
    const isOpen = useSignal(false);
    const menuRef = useSignal<HTMLElement>();

    return (
      <div
        ref={menuRef}
        class="ui-user-menu"
        data-size={size}
        data-align={align}
        data-compact={compact ? 'true' : undefined}
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
          class="ui-user-menu__trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen.value ? 'true' : 'false'}
          disabled={disabled}
          onClick$={() => {
            isOpen.value = !isOpen.value;
          }}
        >
          <Avatar src={user.avatarUrl} name={user.name} />
          <span class="ui-user-menu__identity">
            <strong>{user.name}</strong>
            {user.role && <small>{user.role}</small>}
          </span>
          <span class="ui-user-menu__caret" aria-hidden="true">
            <AppIcon intent="chevron-down" size="xs" />
          </span>
        </button>

        {isOpen.value && (
          <div class="ui-user-menu__content" role="menu">
            <div class="ui-user-menu__summary">
              <Avatar src={user.avatarUrl} name={user.name} size="lg" />
              <span class="ui-user-menu__summary-copy">
                <strong>{user.name}</strong>
                {user.role && <span>{user.role}</span>}
                {user.status && <small>{user.status}</small>}
                {user.meta && <small>{user.meta}</small>}
              </span>
            </div>

            {sessionLabel && (
              <div class="ui-user-menu__session">
                <AppIcon intent="lock" size="sm" />
                <span>{sessionLabel}</span>
              </div>
            )}

            <div class="ui-user-menu__actions">
              {actions.map((action) => {
                if (action.type === 'separator') {
                  return (
                    <span
                      key={action.id}
                      class="ui-user-menu__separator"
                      role="separator"
                    />
                  );
                }

                if (action.type === 'label') {
                  return (
                    <span key={action.id} class="ui-user-menu__label">
                      {action.label}
                    </span>
                  );
                }

                return (
                  <button
                    key={action.id}
                    class="ui-user-menu__item"
                    type="button"
                    role="menuitem"
                    data-tone={action.tone}
                    disabled={action.disabled}
                    onClick$={async () => {
                      if (action.disabled) {
                        return;
                      }

                      await action.onSelect$?.();
                      isOpen.value = false;
                    }}
                  >
                    {action.icon && (
                      <span class="ui-user-menu__item-icon" aria-hidden="true">
                        <AppIcon intent={action.icon} size="sm" />
                      </span>
                    )}
                    <span class="ui-user-menu__item-label">{action.label}</span>
                    {action.shortcut && (
                      <span class="ui-user-menu__shortcut">
                        {action.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  },
);
