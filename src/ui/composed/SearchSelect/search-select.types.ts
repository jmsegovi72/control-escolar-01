import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';
import type {
  InputSize,
  InputVariant,
} from '~/ui/primitives/Input/input.types';

export type SearchSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type SearchSelectProps = {
  options: SearchSelectOption[];
  query?: string;
  value?: string;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  variant?: InputVariant;
  size?: InputSize;
  iconLeft?: IconIntent;
  /** 'client' (default) filters options by query; 'external' shows all options as-is (API already filters). */
  filterMode?: 'client' | 'external';
  onQueryChange$?: QRL<(query: string) => void>;
  onSelect$?: QRL<(option: SearchSelectOption) => void>;
  onClear$?: QRL<() => void>;
};
