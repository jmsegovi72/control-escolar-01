import { ENV } from '~/config/env';
import type { UserListItem } from '~/types/user.types';

export const resolvePhotoUrl = (user: UserListItem): string => {
  if (!user.photoUrl) {
    return user.userTypeCode === 'SUPER'
      ? '/avatars/admin-default.svg'
      : '/avatars/user-default.svg';
  }

  if (
    user.photoUrl.startsWith('http') ||
    user.photoUrl.startsWith('/avatars/')
  ) {
    return user.photoUrl;
  }

  const apiBase = ENV.API_URL.replace(/\/sices\/v\d+$/, '');
  return `${apiBase}/${user.photoUrl.replace(/^\/+/, '')}`;
};
