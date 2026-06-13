import { ENV } from '~/config/env';
import type { User } from '~/types/auth.types';
import type { SidebarStatusTone } from '~/ui/patterns/Sidebar/sidebar.types';
import { sessionStore } from '~/utils/session';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const formatDate = (date: Date) =>
  date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const getTokenRemaining = () => {
  const token = sessionStore.getToken();
  if (!token)
    return { label: '00:00:00', tone: 'offline' as SidebarStatusTone };

  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    const expiration = Number(payload.exp ?? 0) * 1000;
    const remaining = expiration - Date.now();

    if (remaining <= 0) {
      return { label: '00:00:00', tone: 'offline' as SidebarStatusTone };
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const label = [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
    const tone: SidebarStatusTone =
      remaining <= 30 * 60 * 1000 ? 'warning' : 'online';

    return { label, tone };
  } catch {
    return { label: 'No disponible', tone: 'neutral' as SidebarStatusTone };
  }
};

export const getAvatarUrl = (user: User) => {
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
