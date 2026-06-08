import { component$ } from '@builder.io/qwik';

import { Button } from '../Button/Button';
import type { IconButtonProps } from './icon-button.types';

export const IconButton = component$<IconButtonProps>(
  ({ icon, label, title, ...props }) => {
    return (
      <Button
        {...props}
        aria-label={label}
        iconLeft={icon}
        title={title ?? label}
      />
    );
  },
);
