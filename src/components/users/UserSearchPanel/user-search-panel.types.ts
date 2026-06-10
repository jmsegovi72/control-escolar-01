import type { PropFunction } from '@builder.io/qwik';

import type { FindUsersParams } from '~/types/user.types';
import type { BadgeTone } from '~/ui/primitives/Badge/badge.types';

export interface UserSearchPanelProps {
  title: string;
  description: string;
  fieldHint: string;
  noResultsMessage: string;
  filters?: Pick<FindUsersParams, 'isActive' | 'isFirstLogin' | 'isLocked'>;
  limit?: number;
  badgeField?: 'isActive' | 'firstLogin';
  badgeTrueLabel?: string;
  badgeFalseLabel?: string;
  badgeTrueTone?: BadgeTone;
  badgeFalseTone?: BadgeTone;
  onSelect$: PropFunction<(userId: number) => void>;
}
