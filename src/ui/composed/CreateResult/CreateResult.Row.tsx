import { component$ } from '@builder.io/qwik';
import type { CreateResultRowProps } from './CreateResult.types';

export const CreateResultRow = component$<CreateResultRowProps>(
  ({ label, value, fallback = '—' }) => {
    return (
      <div class="create-result__row">
        <span class="create-result__row-label">{label}</span>
        <strong class="create-result__row-value">
          {value !== null && value !== undefined && value !== ''
            ? value
            : fallback}
        </strong>
      </div>
    );
  },
);
