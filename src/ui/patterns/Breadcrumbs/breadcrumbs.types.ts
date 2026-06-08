import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type BreadcrumbItem = {
  id: string;
  label: string;
  href?: string;
  icon?: IconIntent;
  current?: boolean;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  onNavigate$?: QRL<(item: BreadcrumbItem) => void>;
};
