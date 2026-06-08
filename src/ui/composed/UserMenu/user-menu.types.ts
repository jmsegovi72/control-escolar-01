import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type UserMenuSize = 'sm' | 'md';

export type UserMenuTone = 'neutral' | 'danger' | 'warning' | 'success';

export type UserMenuUser = {
  name: string;
  role?: string;
  initials?: string;
  avatarUrl?: string;
  status?: string;
  meta?: string;
};

export type UserMenuAction =
  | {
      type?: 'item';
      id: string;
      label: string;
      icon?: IconIntent;
      tone?: UserMenuTone;
      shortcut?: string;
      disabled?: boolean;
      onSelect$?: QRL<() => void>;
    }
  | {
      type: 'separator';
      id: string;
    }
  | {
      type: 'label';
      id: string;
      label: string;
    };

export type UserMenuProps = {
  user: UserMenuUser;
  actions: UserMenuAction[];
  size?: UserMenuSize;
  align?: 'start' | 'end';
  compact?: boolean;
  disabled?: boolean;
  sessionLabel?: string;
};
