import { component$ } from '@builder.io/qwik';

import { Input } from '~/ui/primitives/Input/Input';
import type { DateInputProps } from './date-input.types';
import './date-input.css';

export const DateInput = component$<DateInputProps>(
  ({ showIcon = true, ...props }) => {
    return (
      <Input
        {...props}
        type="date"
        iconLeft={showIcon ? 'schedule' : undefined}
      />
    );
  },
);
