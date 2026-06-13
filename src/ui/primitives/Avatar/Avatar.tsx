import { component$ } from '@builder.io/qwik';

import type { AvatarProps } from './avatar.types';
import './avatar.css';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Avatar = component$<AvatarProps>(({ src, name, size = 'md' }) => {
  const initials = getInitials(name);

  return (
    <span class="ui-avatar" data-size={size} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <span>{initials}</span>}
    </span>
  );
});
