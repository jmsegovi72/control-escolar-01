import { component$ } from '@builder.io/qwik';

import { AppIcon } from '~/ui/icons';
import type { BreadcrumbsProps } from './breadcrumbs.types';
import './breadcrumbs.css';

export const Breadcrumbs = component$<BreadcrumbsProps>(
  ({ items, onNavigate$ }) => {
    return (
      <nav class="ui-breadcrumbs" aria-label="Ruta de navegacion">
        <ol class="ui-breadcrumbs__list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isCurrent = item.current || isLast;

            return (
              <li class="ui-breadcrumbs__item" key={item.id}>
                {index > 0 && (
                  <span class="ui-breadcrumbs__separator" aria-hidden="true">
                    <AppIcon intent="chevron-right" size="xs" />
                  </span>
                )}

                {isCurrent ? (
                  <span class="ui-breadcrumbs__current" aria-current="page">
                    {item.icon && <AppIcon intent={item.icon} size="xs" />}
                    <span>{item.label}</span>
                  </span>
                ) : (
                  <button
                    class="ui-breadcrumbs__link"
                    type="button"
                    onClick$={() => onNavigate$?.(item)}
                  >
                    {item.icon && <AppIcon intent={item.icon} size="xs" />}
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);
