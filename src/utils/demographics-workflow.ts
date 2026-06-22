import type { ViewDemographic } from '~/types/demographic.types';
import {
  type ModuleWorkState,
  moduleWorkContext,
} from '~/utils/module-work-context';

export type DemographicSearchFilters = {
  searchTerm: string;
  fullName: string;
  gender: string;
  maritalStatus: string;
  indigenousLanguage: string;
  foreignLanguage: string;
  specialCondition: string;
  isIndigenous: 'all' | 'true' | 'false';
  isAfroDescendant: 'all' | 'true' | 'false';
  limit: number;
  page: number;
};

export type DemographicsWorkState = ModuleWorkState<ViewDemographic> & {
  filters: DemographicSearchFilters;
};

export const DEMOGRAPHICS_MODULE = 'demographics';
export const DEMOGRAPHICS_SEARCH_PATH = '/persons/demographics/search';

export const demographicsWorkflow = {
  clear(): void {
    moduleWorkContext.clear(DEMOGRAPHICS_MODULE);
  },

  getState(): DemographicsWorkState | null {
    return moduleWorkContext.get<ViewDemographic>(
      DEMOGRAPHICS_MODULE,
    ) as DemographicsWorkState | null;
  },

  getReturnPath(): string {
    return this.getState()?.returnPath ?? DEMOGRAPHICS_SEARCH_PATH;
  },

  getSelectedDemographic(): ViewDemographic | null {
    return this.getState()?.selectedItem ?? null;
  },

  save(
    filters: DemographicSearchFilters,
    selectedItem?: ViewDemographic,
  ): void {
    moduleWorkContext.save<ViewDemographic>({
      filters,
      module: DEMOGRAPHICS_MODULE,
      returnPath: DEMOGRAPHICS_SEARCH_PATH,
      selectedItem,
    });
  },
};
