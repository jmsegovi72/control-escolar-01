import { component$ } from '@builder.io/qwik';
import type { EditResultRowProps } from './EditResult.types';

export const EditResultRow = component$<EditResultRowProps>(
  ({ label, value, fallback = '—' }) => {
    return (
      <div class="edit-result__row">
        <span class="edit-result__row-label">{label}</span>
        <strong class="edit-result__row-value">
          {value !== null && value !== undefined && value !== ''
            ? value
            : fallback}
        </strong>
      </div>
    );
  },
);
