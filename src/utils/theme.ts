import { $, type QRL } from '@builder.io/qwik';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'sices-theme';

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'auto';

export const readStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
};

export const writeStoredTheme = (mode: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
};

export const systemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === 'auto') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
};

export const applyThemeToDocument = (resolved: ResolvedTheme): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolved;
};

export const watchSystemTheme = (
  onChange: QRL<(dark: boolean) => void>,
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => onChange(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
};

export const applyTheme$ = $((mode: ThemeMode) => {
  writeStoredTheme(mode);
  applyThemeToDocument(resolveTheme(mode));
});
