import { component$, Slot } from '@builder.io/qwik';

import type { PageHeaderProps } from './page-header.types';
import './page-header.css';

export const PageHeader = component$<PageHeaderProps>(
  ({ eyebrow, title, description, meta, density = 'comfortable' }) => {
    return (
      <header class="ui-page-header" data-density={density}>
        <div class="ui-page-header__content">
          {eyebrow && <span class="ui-page-header__eyebrow">{eyebrow}</span>}
          <div class="ui-page-header__title-row">
            <h1 class="ui-page-header__title">{title}</h1>
            {meta && <span class="ui-page-header__meta">{meta}</span>}
          </div>
          {description && (
            <p class="ui-page-header__description">{description}</p>
          )}
        </div>
        <div class="ui-page-header__actions">
          <Slot name="actions" />
        </div>
      </header>
    );
  },
);
