export type ModuleWorkFilters = Record<
  string,
  string | number | boolean | null
>;

export interface ModuleWorkState<TSelected = unknown> {
  filters: ModuleWorkFilters;
  module: string;
  returnPath: string;
  selectedItem?: TSelected;
}

const STORAGE_PREFIX = 'module-work-context';

const canUseStorage = () => typeof window !== 'undefined';

const getKey = (module: string) => `${STORAGE_PREFIX}:${module}`;

export const moduleWorkContext = {
  save<TSelected>(state: ModuleWorkState<TSelected>): void {
    if (!canUseStorage()) return;
    sessionStorage.setItem(getKey(state.module), JSON.stringify(state));
  },

  get<TSelected>(module: string): ModuleWorkState<TSelected> | null {
    if (!canUseStorage()) return null;

    const value = sessionStorage.getItem(getKey(module));
    if (!value) return null;

    try {
      return JSON.parse(value) as ModuleWorkState<TSelected>;
    } catch {
      sessionStorage.removeItem(getKey(module));
      return null;
    }
  },

  clear(module: string): void {
    if (!canUseStorage()) return;
    sessionStorage.removeItem(getKey(module));
  },
};
