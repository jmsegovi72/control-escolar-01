import { component$ } from '@builder.io/qwik';

import type { SkeletonProps } from './skeleton.types';
import './skeleton.css';

const range = (count: number) =>
  Array.from({ length: count }, (_, index) => index);

export const Skeleton = component$<SkeletonProps>(
  ({ variant = 'text', rows = 3, size = 'md', animated = true }) => {
    const rowCount = Math.max(1, rows);

    if (variant === 'table') {
      return (
        <div class="ui-skeleton ui-skeleton-table" data-animated={animated}>
          <div class="ui-skeleton-table__header">
            {range(4).map((index) => (
              <span key={index} class="ui-skeleton__bone" />
            ))}
          </div>
          {range(rowCount).map((row) => (
            <div key={row} class="ui-skeleton-table__row">
              {range(4).map((column) => (
                <span key={column} class="ui-skeleton__bone" />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (variant === 'form') {
      return (
        <div class="ui-skeleton ui-skeleton-form" data-animated={animated}>
          {range(rowCount).map((row) => (
            <div key={row} class="ui-skeleton-form__field">
              <span class="ui-skeleton__bone ui-skeleton-form__label" />
              <span class="ui-skeleton__bone ui-skeleton-form__input" />
            </div>
          ))}
        </div>
      );
    }

    if (variant === 'avatar') {
      return (
        <span
          class="ui-skeleton ui-skeleton__bone ui-skeleton-avatar"
          data-size={size}
          data-animated={animated}
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        class="ui-skeleton ui-skeleton-lines"
        data-variant={variant}
        data-size={size}
        data-animated={animated}
        aria-hidden="true"
      >
        {range(rowCount).map((row) => (
          <span key={row} class="ui-skeleton__bone" />
        ))}
      </div>
    );
  },
);
