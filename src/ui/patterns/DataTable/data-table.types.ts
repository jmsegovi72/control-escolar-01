import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';
import type { BadgeTone } from '~/ui/primitives/Badge/badge.types';
import type { SelectOption } from '~/ui/primitives/Select/select.types';

export type DataTableCellValue = string | number | boolean | null | undefined;

export type DataTableAlign = 'left' | 'center' | 'right';

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableFilter =
  | {
      type: 'text';
      placeholder?: string;
    }
  | {
      type: 'select';
      placeholder?: string;
      options: SelectOption[];
    };

export type DataTableColumn<T> = {
  key: keyof T | string;
  label: string;
  width?: string;
  align?: DataTableAlign;
  sortable?: boolean;
  filter?: DataTableFilter;
  render$?: QRL<(row: T) => DataTableCellValue>;
  badge?:
    | boolean
    | {
        tone?: BadgeTone;
        toneMap?: Record<string, BadgeTone>;
      };
};

export type DataTableAction<T> = {
  label: string;
  icon: IconIntent;
  tone?: 'neutral' | 'primary' | 'danger';
  show$?: QRL<(row: T) => boolean>;
  onClick$?: QRL<(row: T) => void | Promise<void>>;
};

export type DataTablePagination = {
  page: number;
  limit: number;
  total: number;
};

export type DataTableFilterChange = {
  key: string;
  value: string;
};

export type DataTableSortChange = {
  key: string;
  direction: DataTableSortDirection;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey?: keyof T | QRL<(row: T, index: number) => string | number>;
  actions?: DataTableAction<T>[];
  actionMode?: 'auto' | 'inline' | 'menu';
  pagination?: DataTablePagination;
  pageSizeOptions?: number[];
  loading?: boolean;
  searchable?: boolean;
  hasActiveFilters?: boolean;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
  selectable?: boolean;
  selectedRows?: Array<string | number>;
  onSearch$?: QRL<(value: string) => void>;
  onFilter$?: QRL<(change: DataTableFilterChange) => void>;
  onClearFilters$?: QRL<() => void>;
  onSort$?: QRL<(change: DataTableSortChange) => void>;
  onPage$?: QRL<(page: number) => void>;
  onLimit$?: QRL<(limit: number) => void>;
  onRowSelect$?: QRL<(row: T, checked: boolean) => void>;
  onSelectAll$?: QRL<(checked: boolean) => void>;
};
