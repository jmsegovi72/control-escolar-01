import { $, component$, useSignal } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import { Badge } from '~/ui/primitives/Badge/Badge';
import { Button } from '~/ui/primitives/Button/Button';
import type {
  NotificationCenterProps,
  NotificationTone,
} from './notification-center.types';
import './notification-center.css';

const toneIcon: Record<NotificationTone, 'info' | 'success' | 'warning'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
};

export const NotificationCenter = component$<NotificationCenterProps>(
  ({
    items,
    label = 'Notificaciones',
    title = 'Notificaciones',
    emptyTitle = 'Sin notificaciones',
    emptyDescription = 'No hay avisos pendientes por revisar.',
    align = 'end',
    size = 'md',
    maxItems,
    unreadCount: unreadCountProp,
    disabled,
    onMarkAllRead$,
  }) => {
    const isOpen = useSignal(false);
    const centerRef = useSignal<HTMLElement>();
    const unreadCount =
      unreadCountProp ?? items.filter((item) => item.unread).length;
    const visibleItems = maxItems ? items.slice(0, maxItems) : items;

    return (
      <div
        ref={centerRef}
        class="ui-notification-center"
        data-align={align}
        data-size={size}
        data-open={isOpen.value ? 'true' : undefined}
        document:onClick$={$((event) => {
          const target = event.target as HTMLElement;

          if (centerRef.value?.contains(target)) {
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
          class="ui-notification-center__trigger"
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={isOpen.value ? 'true' : 'false'}
          disabled={disabled}
          onClick$={() => {
            isOpen.value = !isOpen.value;
          }}
        >
          <AppIcon intent="notifications" size="sm" />
          {unreadCount > 0 && (
            <span class="ui-notification-center__count">{unreadCount}</span>
          )}
        </button>

        {isOpen.value && (
          <section class="ui-notification-center__panel" role="menu">
            <header class="ui-notification-center__header">
              <div>
                <h2>{title}</h2>
                <span>
                  {unreadCount > 0
                    ? `${unreadCount} sin leer`
                    : 'Todo revisado'}
                </span>
              </div>
              {items.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick$={() => onMarkAllRead$?.()}
                >
                  Marcar leidas
                </Button>
              )}
            </header>

            {visibleItems.length > 0 ? (
              <div class="ui-notification-center__list">
                {visibleItems.map((item) => {
                  const tone = item.tone ?? 'info';

                  return (
                    <article
                      class="ui-notification-center__item"
                      data-tone={tone}
                      data-unread={item.unread ? 'true' : undefined}
                      key={item.id}
                      role="menuitem"
                    >
                      <span
                        class="ui-notification-center__item-icon"
                        aria-hidden="true"
                      >
                        <AppIcon
                          intent={item.icon ?? toneIcon[tone]}
                          size="sm"
                        />
                      </span>
                      <div class="ui-notification-center__item-copy">
                        <div class="ui-notification-center__item-title">
                          <strong>{item.title}</strong>
                          {item.unread && <Badge size="sm">Nuevo</Badge>}
                        </div>
                        {item.description && <p>{item.description}</p>}
                        <div class="ui-notification-center__item-meta">
                          {item.time && <span>{item.time}</span>}
                          {item.actionLabel && (
                            <button
                              type="button"
                              onClick$={async () => {
                                await item.onAction$?.();
                                isOpen.value = false;
                              }}
                            >
                              {item.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div class="ui-notification-center__empty">
                <AppIcon intent="success" size="lg" />
                <strong>{emptyTitle}</strong>
                <span>{emptyDescription}</span>
              </div>
            )}
          </section>
        )}
      </div>
    );
  },
);
