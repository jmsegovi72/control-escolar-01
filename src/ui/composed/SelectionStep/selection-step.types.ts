import type { QRL } from '@builder.io/qwik';

import type { SearchSelectOption } from '~/ui/composed/SearchSelect/search-select.types';

export type SelectionStepProps = {
  title: string;
  description?: string;
  fieldLabel: string;
  fieldHint?: string;
  placeholder?: string;
  emptyMessage?: string;
  options: SearchSelectOption[];
  loading?: boolean;
  query: string;
  filterMode?: 'client' | 'external';
  onQueryChange$: QRL<(query: string) => void>;
  onSelect$: QRL<(option: SearchSelectOption) => void>;
};
