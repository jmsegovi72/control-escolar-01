import { component$, Slot } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { AppShellProps } from './app-shell.types';
import './app-shell.css';

export const AppShell = component$<AppShellProps>(
  ({
    eyebrow,
    title,
    description,
    meta,
    density = 'comfortable',
    headerVariant = 'stacked',
    sidebarOpen,
    sidebarToggleLabel = 'Abrir menu',
    onToggleSidebar$,
  }) => {
    const hasSidebarControl =
      sidebarOpen !== undefined || onToggleSidebar$ !== undefined;

    return (
      <section
        class="ui-app-shell"
        data-density={density}
        data-header-variant={headerVariant}
        data-sidebar-open={sidebarOpen ? 'true' : undefined}
      >
        {hasSidebarControl && (
          <button
            class="ui-app-shell__overlay"
            type="button"
            aria-label="Cerrar menu"
            onClick$={() => onToggleSidebar$?.()}
          />
        )}

        <div class="ui-app-shell__sidebar">
          <Slot name="sidebar" />
        </div>

        <div class="ui-app-shell__workspace">
          <header class="ui-app-shell__header">
            <div class="ui-app-shell__heading">
              {headerVariant === 'stacked' && eyebrow && (
                <span class="ui-app-shell__eyebrow">{eyebrow}</span>
              )}
              <div class="ui-app-shell__title-row">
                {hasSidebarControl && (
                  <button
                    class="ui-app-shell__menu-button"
                    type="button"
                    aria-label={sidebarToggleLabel}
                    aria-expanded={sidebarOpen ? 'true' : 'false'}
                    onClick$={() => onToggleSidebar$?.()}
                  >
                    <AppIcon intent="dashboard" size="sm" />
                  </button>
                )}
                {headerVariant === 'inline' ? (
                  <div class="ui-app-shell__inline-path">
                    {eyebrow && (
                      <span class="ui-app-shell__inline-eyebrow">
                        {eyebrow}
                      </span>
                    )}
                    {eyebrow && (
                      <span
                        class="ui-app-shell__inline-separator"
                        aria-hidden="true"
                      >
                        /
                      </span>
                    )}
                    <h1>{title}</h1>
                    {meta && <span class="ui-app-shell__meta">{meta}</span>}
                  </div>
                ) : (
                  <>
                    <h1>{title}</h1>
                    {meta && <span class="ui-app-shell__meta">{meta}</span>}
                  </>
                )}
              </div>
              {headerVariant === 'stacked' && description && (
                <p>{description}</p>
              )}
            </div>

            <div class="ui-app-shell__actions">
              <Slot name="actions" />
            </div>
          </header>

          <div class="ui-app-shell__toolbar">
            <Slot name="toolbar" />
          </div>

          <main class="ui-app-shell__content">
            <Slot />
          </main>
        </div>
      </section>
    );
  },
);
