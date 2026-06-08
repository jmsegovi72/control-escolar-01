import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

export type NotificationCenterAlign = 'start' | 'end';

export type NotificationCenterSize = 'sm' | 'md';

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  tone?: NotificationTone;
  icon?: IconIntent;
  time?: string;
  unread?: boolean;
  actionLabel?: string;
  onAction$?: QRL<() => void>;
};

export type NotificationCenterProps = {
  items: NotificationItem[];
  label?: string;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  align?: NotificationCenterAlign;
  size?: NotificationCenterSize;
  maxItems?: number;
  unreadCount?: number;
  disabled?: boolean;
  onMarkAllRead$?: QRL<() => void>;
};
