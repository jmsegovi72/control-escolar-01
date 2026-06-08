import { component$, Slot } from '@builder.io/qwik';

import type { BadgeProps } from './badge.types';
import './badge.css';

export const Badge = component$<BadgeProps>(
  ({ tone = 'neutral', size = 'md' }) => {
    return (
      <span class="ui-badge" data-tone={tone} data-size={size}>
        <Slot />
      </span>
    );
  },
);
