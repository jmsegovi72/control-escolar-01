import type { UserListItem } from '~/types/user.types';
import {
  type ModuleWorkState,
  moduleWorkContext,
} from '~/utils/module-work-context';

export type UserSearchFilters = {
  fullName: string;
  isActive: string;
  isFirstLogin: string;
  limit: number;
  page: number;
  roleName: string;
  searchTerm: string;
  userTypeName: string;
};

export type UsersWorkState = ModuleWorkState<UserListItem> & {
  filters: UserSearchFilters;
};

export const USERS_MODULE = 'users';
export const USERS_SEARCH_PATH = '/users/search';

export const usersWorkflow = {
  clear(): void {
    moduleWorkContext.clear(USERS_MODULE);
  },

  getState(): UsersWorkState | null {
    return moduleWorkContext.get<UserListItem>(
      USERS_MODULE,
    ) as UsersWorkState | null;
  },

  getReturnPath(): string {
    return this.getState()?.returnPath ?? USERS_SEARCH_PATH;
  },

  getSelectedUser(): UserListItem | null {
    return this.getState()?.selectedItem ?? null;
  },

  save(filters: UserSearchFilters, selectedItem?: UserListItem): void {
    moduleWorkContext.save<UserListItem>({
      filters,
      module: USERS_MODULE,
      returnPath: USERS_SEARCH_PATH,
      selectedItem,
    });
  },
};
