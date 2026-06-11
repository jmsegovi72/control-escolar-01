import type { PropFunction } from '@builder.io/qwik';

export interface DerivedFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  initialEnabled?: boolean;
  onChange$?: PropFunction<(enabled: boolean) => void>;
  class?: string;
}
