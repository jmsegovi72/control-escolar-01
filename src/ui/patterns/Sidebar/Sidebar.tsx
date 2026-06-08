import { component$ } from '@builder.io/qwik';

import { UserMenu } from '~/ui/composed/UserMenu/UserMenu';
import { AppIcon } from '~/ui/icons';
import type { SidebarItem, SidebarProps } from './sidebar.types';
import './sidebar.css';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

type SidebarItemButtonProps = {
  item: SidebarItem;
  activeItem?: string;
  openItems?: string[];
  collapsed?: boolean;
  depth?: number;
  onNavigate$?: SidebarProps['onNavigate$'];
  onToggleItem$?: SidebarProps['onToggleItem$'];
};

const hasActiveDescendant = (item: SidebarItem, activeItem?: string): boolean =>
  Boolean(
    item.children?.some(
      (child) =>
        child.active ||
        child.id === activeItem ||
        hasActiveDescendant(child, activeItem),
    ),
  );

const SidebarItemButton = component$<SidebarItemButtonProps>(
  ({
    item,
    activeItem,
    openItems,
    collapsed,
    depth = 0,
    onNavigate$,
    onToggleItem$,
  }) => {
    const isActive = item.active || item.id === activeItem;
    const hasChildren = Boolean(item.children?.length);
    const isOpen = openItems
      ? openItems.includes(item.id) || hasActiveDescendant(item, activeItem)
      : (item.open ?? true);

    return (
      <div class="ui-sidebar__item-wrap" data-depth={depth}>
        <button
          class="ui-sidebar__item"
          type="button"
          title={collapsed ? item.label : undefined}
          data-active={isActive ? 'true' : undefined}
          data-disabled={item.disabled ? 'true' : undefined}
          data-open={hasChildren && isOpen ? 'true' : undefined}
          aria-expanded={hasChildren ? (isOpen ? 'true' : 'false') : undefined}
          disabled={item.disabled}
          onClick$={() => {
            if (hasChildren) {
              onToggleItem$?.(item, !isOpen);
            }

            onNavigate$?.(item);
          }}
        >
          <span class="ui-sidebar__item-icon" aria-hidden="true">
            <AppIcon intent={item.icon} context="navigation" size="sm" />
          </span>
          <span class="ui-sidebar__item-label">{item.label}</span>
          {item.badge !== undefined && (
            <span class="ui-sidebar__badge">{item.badge}</span>
          )}
          {hasChildren && (
            <span class="ui-sidebar__item-caret" aria-hidden="true">
              <AppIcon intent="chevron-down" size="xs" />
            </span>
          )}
        </button>

        {!collapsed && hasChildren && (
          <div
            class="ui-sidebar__children"
            data-open={isOpen ? 'true' : undefined}
          >
            <div class="ui-sidebar__children-inner">
              {item.children?.map((child) => (
                <SidebarItemButton
                  key={child.id}
                  item={child}
                  activeItem={activeItem}
                  openItems={openItems}
                  depth={depth + 1}
                  onNavigate$={onNavigate$}
                  onToggleItem$={onToggleItem$}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export const Sidebar = component$<SidebarProps>(
  ({
    brand,
    sections,
    activeItem,
    openItems,
    collapsed,
    clock,
    systemStatus,
    user,
    userActions,
    userMenuSessionLabel,
    footerItems,
    onNavigate$,
    onToggleItem$,
    onToggleCollapse$,
  }) => {
    const initials = user?.initials ?? (user ? getInitials(user.name) : '');

    return (
      <aside
        class="ui-sidebar"
        data-collapsed={collapsed ? 'true' : undefined}
        aria-label="Navegacion principal"
      >
        <div class="ui-sidebar__brand">
          <div class="ui-sidebar__brand-mark" aria-hidden="true">
            {brand.shortName ?? brand.name.slice(0, 2).toUpperCase()}
          </div>
          <div class="ui-sidebar__brand-copy">
            <strong>{brand.name}</strong>
            {brand.subtitle && <span>{brand.subtitle}</span>}
          </div>
          <button
            class="ui-sidebar__collapse"
            type="button"
            aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            onClick$={() => onToggleCollapse$?.()}
          >
            <AppIcon
              intent={collapsed ? 'chevron-right' : 'chevron-left'}
              size="xs"
            />
          </button>
        </div>

        {clock && (
          <div
            class="ui-sidebar__clock"
            title={collapsed ? clock.time : undefined}
          >
            <span class="ui-sidebar__clock-icon" aria-hidden="true">
              <AppIcon intent="schedule" size="sm" />
            </span>
            <span class="ui-sidebar__clock-copy">
              <span>{clock.label ?? 'Hora actual'}</span>
              <strong>{clock.time}</strong>
              {clock.date && <small>{clock.date}</small>}
            </span>
          </div>
        )}

        {systemStatus && (
          <div class="ui-sidebar__system">
            {systemStatus.items?.length ? (
              <div class="ui-sidebar__status-list">
                {systemStatus.items.map((item) => (
                  <div
                    class="ui-sidebar__status"
                    data-tone={item.tone}
                    title={
                      collapsed
                        ? `${item.label}${item.value ? `: ${item.value}` : ''}`
                        : undefined
                    }
                    key={item.id}
                  >
                    <span class="ui-sidebar__status-dot" aria-hidden="true" />
                    <span class="ui-sidebar__status-copy">
                      <span>{item.label}</span>
                      {item.value && <strong>{item.value}</strong>}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {systemStatus.session && (
              <div
                class="ui-sidebar__session"
                data-tone={systemStatus.session.tone ?? 'neutral'}
                title={collapsed ? systemStatus.session.remaining : undefined}
              >
                <span class="ui-sidebar__session-icon" aria-hidden="true">
                  <AppIcon intent="lock" size="sm" />
                </span>
                <span class="ui-sidebar__session-copy">
                  <span>{systemStatus.session.label ?? 'Sesion'}</span>
                  <strong>{systemStatus.session.remaining}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        <nav class="ui-sidebar__nav">
          {sections.map((section) => (
            <section class="ui-sidebar__section" key={section.id}>
              {section.label && (
                <h2 class="ui-sidebar__section-title">{section.label}</h2>
              )}
              <div class="ui-sidebar__section-items">
                {section.items.map((item) => (
                  <SidebarItemButton
                    key={item.id}
                    item={item}
                    activeItem={activeItem}
                    openItems={openItems}
                    collapsed={collapsed}
                    onNavigate$={onNavigate$}
                    onToggleItem$={onToggleItem$}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div class="ui-sidebar__footer">
          {footerItems?.length ? (
            <div class="ui-sidebar__footer-items">
              {footerItems.map((item) => (
                <SidebarItemButton
                  key={item.id}
                  item={item}
                  activeItem={activeItem}
                  openItems={openItems}
                  collapsed={collapsed}
                  onNavigate$={onNavigate$}
                  onToggleItem$={onToggleItem$}
                />
              ))}
            </div>
          ) : null}

          {user && userActions?.length ? (
            <div class="ui-sidebar__user-menu">
              <UserMenu
                compact={collapsed}
                align="start"
                user={user}
                actions={userActions}
                sessionLabel={userMenuSessionLabel}
              />
            </div>
          ) : user ? (
            <div
              class="ui-sidebar__user"
              title={collapsed ? user.name : undefined}
            >
              <div class="ui-sidebar__avatar" aria-hidden="true">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" width={40} height={40} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div class="ui-sidebar__user-copy">
                <strong>{user.name}</strong>
                {user.role && <span>{user.role}</span>}
                {user.status && <small>{user.status}</small>}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    );
  },
);
