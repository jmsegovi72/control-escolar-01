import type { AddressListItem } from '~/types/address.types';
import {
  type ModuleWorkState,
  moduleWorkContext,
} from '~/utils/module-work-context';

export type AddressSearchFilters = {
  searchTerm: string;
  fullName: string;
  stateName: string;
  municipalityName: string;
  zipCode: string;
  street: string;
  settlement: string;
  limit: number;
  page: number;
};

export type AddressesWorkState = ModuleWorkState<AddressListItem> & {
  filters: AddressSearchFilters;
};

export const ADDRESSES_MODULE = 'addresses';
export const ADDRESSES_SEARCH_PATH = '/persons/addresses/search';

export const addressesWorkflow = {
  clear(): void {
    moduleWorkContext.clear(ADDRESSES_MODULE);
  },

  getState(): AddressesWorkState | null {
    return moduleWorkContext.get<AddressListItem>(
      ADDRESSES_MODULE,
    ) as AddressesWorkState | null;
  },

  getReturnPath(): string {
    return this.getState()?.returnPath ?? ADDRESSES_SEARCH_PATH;
  },

  getSelectedAddress(): AddressListItem | null {
    return this.getState()?.selectedItem ?? null;
  },

  save(filters: AddressSearchFilters, selectedItem?: AddressListItem): void {
    moduleWorkContext.save<AddressListItem>({
      filters,
      module: ADDRESSES_MODULE,
      returnPath: ADDRESSES_SEARCH_PATH,
      selectedItem,
    });
  },
};
