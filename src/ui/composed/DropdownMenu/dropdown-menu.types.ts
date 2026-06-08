import type { QRL } from '@builder.io/qwik';

import type { IconIntent } from '~/ui/icons';

export type DropdownMenuAlign = 'start' | 'end';

export type DropdownMenuSize = 'sm' | 'md';

export type DropdownMenuTone = 'neutral' | 'danger' | 'warning' | 'success';

export type DropdownMenuItem =
  | {
      type?: 'item';
      id: string;
      label: string;
      icon?: IconIntent;
      tone?: DropdownMenuTone;
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

export type DropdownMenuProps = {
  label: string;
  items: DropdownMenuItem[];
  icon?: IconIntent;
  align?: DropdownMenuAlign;
  size?: DropdownMenuSize;
  disabled?: boolean;
};
