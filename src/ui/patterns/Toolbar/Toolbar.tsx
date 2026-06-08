import { component$, Slot } from '@builder.io/qwik';

import type { ToolbarProps } from './toolbar.types';
import './toolbar.css';

export const Toolbar = component$<ToolbarProps>(
  ({ density = 'comfortable', wrap = true }) => {
    return (
      <section
        class="ui-toolbar"
        data-density={density}
        data-wrap={wrap ? 'true' : undefined}
      >
        <div class="ui-toolbar__group ui-toolbar__leading">
          <Slot name="leading" />
        </div>
        <div class="ui-toolbar__group ui-toolbar__center">
          <Slot name="center" />
        </div>
        <div class="ui-toolbar__group ui-toolbar__actions">
          <Slot name="actions" />
        </div>
        <div class="ui-toolbar__extra">
          <Slot />
        </div>
      </section>
    );
  },
);
