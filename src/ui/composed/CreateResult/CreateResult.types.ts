import type { QRL } from '@builder.io/qwik';

export type CreateResultTone = 'success' | 'error';

export type CreateResultProps = {
  tone?: CreateResultTone;
  eyebrow: string;
  title: string;
  description?: string;
  onRetry$?: QRL<() => void | Promise<void>>;
  retryLabel?: string;
  class?: string;
};

export type CreateResultRowProps = {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
};
