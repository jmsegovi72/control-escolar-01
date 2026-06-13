import type { PersonListItem } from '~/types/person.types';
import {
  type ModuleWorkState,
  moduleWorkContext,
} from '~/utils/module-work-context';

export type PersonSearchFilters = {
  searchTerm: string;
  fullName: string;
  curp: string;
  gender: string;
  birthState: string;
  birthMunicipality: string;
  limit: number;
  page: number;
};

export type PersonsWorkState = ModuleWorkState<PersonListItem> & {
  filters: PersonSearchFilters;
};

export const PERSONS_MODULE = 'persons';
export const PERSONS_SEARCH_PATH = '/persons/search';

export const personsWorkflow = {
  clear(): void {
    moduleWorkContext.clear(PERSONS_MODULE);
  },

  getState(): PersonsWorkState | null {
    return moduleWorkContext.get<PersonListItem>(
      PERSONS_MODULE,
    ) as PersonsWorkState | null;
  },

  getReturnPath(): string {
    return this.getState()?.returnPath ?? PERSONS_SEARCH_PATH;
  },

  getSelectedPerson(): PersonListItem | null {
    return this.getState()?.selectedItem ?? null;
  },

  save(filters: PersonSearchFilters, selectedItem?: PersonListItem): void {
    moduleWorkContext.save<PersonListItem>({
      filters,
      module: PERSONS_MODULE,
      returnPath: PERSONS_SEARCH_PATH,
      selectedItem,
    });
  },
};
