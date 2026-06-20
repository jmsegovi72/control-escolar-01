import type { QRL } from '@builder.io/qwik';

export type EditResultTone = 'success' | 'error';

export type EditResultProps = {
  tone?: EditResultTone;
  eyebrow: string;
  title: string;
  description?: string;
  onRetry$?: QRL<() => void | Promise<void>>;
  retryLabel?: string;
  class?: string;
};

export type EditResultRowProps = {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
};
