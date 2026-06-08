import { component$, Slot } from '@builder.io/qwik';

import type { TooltipProps } from './tooltip.types';
import './tooltip.css';

export const Tooltip = component$<TooltipProps>(
  ({ content, placement = 'top', disabled }) => {
    return (
      <span
        class="ui-tooltip"
        data-placement={placement}
        data-disabled={disabled ? 'true' : undefined}
      >
        <Slot />
        {!disabled && (
          <span class="ui-tooltip__bubble" role="tooltip">
            {content}
          </span>
        )}
      </span>
    );
  },
);
