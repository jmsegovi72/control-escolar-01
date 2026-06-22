import type { Settlement, StreetType } from '~/types/address.types';
import type { ApiResponse } from '~/types/api.types';
import type {
  CatalogApiItem,
  Municipality,
  NamedCatalogItem,
  QueryMunicipalityDto,
  Role,
  State,
  UserType,
} from '~/types/catalog.types';
import { apiClient } from '../api.client';

const normalizeNamedCatalogItems = (
  items: CatalogApiItem[] | undefined,
): NamedCatalogItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const rawName =
        item.name ??
        item.status ??
        item.label ??
        item.description ??
        (typeof item.value === 'string' ? item.value : null) ??
        item.maritalStatus ??
        item.indigenousLanguage ??
        item.foreignLanguage ??
        item.specialCondition;

      const name = rawName?.trim();
      if (!name) return null;

      const parsedId =
        typeof item.id === 'number'
          ? item.id
          : Number(item.id ?? index + 1) || index + 1;

      return {
        id: parsedId,
        name,
      };
    })
    .filter((item): item is NamedCatalogItem => item !== null);
};

export const catalogService = {
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<ApiResponse<Role[]>>('/roles');
    return response.data.data;
  },

  async getUserTypes(): Promise<UserType[]> {
    const response =
      await apiClient.get<ApiResponse<UserType[]>>('/user-types');
    return response.data.data;
  },

  async getMunicipalities(
    filters: QueryMunicipalityDto = {},
  ): Promise<Municipality[]> {
    const query = new URLSearchParams();
    if (filters.stateId) query.set('stateId', String(filters.stateId));
    if (filters.stateCode) query.set('stateCode', filters.stateCode);
    if (filters.searchTerm) query.set('searchTerm', filters.searchTerm);

    try {
      const response = await apiClient.get<ApiResponse<Municipality[]>>(
        `/catalog/municipalities?${query.toString()}`,
      );
      return response.data.data;
    } catch {
      const response = await apiClient.get<ApiResponse<Municipality[]>>(
        `/municipalities?${query.toString()}`,
      );
      return response.data.data;
    }
  },

  async getStates(): Promise<State[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<State[]>>('/catalog/states');
      return response.data.data;
    } catch {
      const response = await apiClient.get<ApiResponse<State[]>>('/states');
      return response.data.data;
    }
  },

  async getStreetTypes(): Promise<StreetType[]> {
    const response =
      await apiClient.get<ApiResponse<StreetType[]>>('/street-types');
    return response.data.data;
  },

  async getSettlements(zipCode: string): Promise<Settlement[]> {
    const response = await apiClient.get<ApiResponse<Settlement[]>>(
      `/settlements/${zipCode}`,
    );
    return response.data.data;
  },

  async getMaritalStatuses(): Promise<NamedCatalogItem[]> {
    const response = await apiClient.get<ApiResponse<CatalogApiItem[]>>(
      '/catalog/marital-statuses',
    );
    return normalizeNamedCatalogItems(response.data.data);
  },

  async getIndigenousLanguages(): Promise<NamedCatalogItem[]> {
    const response = await apiClient.get<ApiResponse<CatalogApiItem[]>>(
      '/catalog/indigenous-languages',
    );
    return normalizeNamedCatalogItems(response.data.data);
  },

  async getForeignLanguages(): Promise<NamedCatalogItem[]> {
    const response = await apiClient.get<ApiResponse<CatalogApiItem[]>>(
      '/catalog/foreign-languages',
    );
    return normalizeNamedCatalogItems(response.data.data);
  },

  async getSpecialConditions(): Promise<NamedCatalogItem[]> {
    const response = await apiClient.get<ApiResponse<CatalogApiItem[]>>(
      '/catalog/special-conditions',
    );
    return normalizeNamedCatalogItems(response.data.data);
  },
};
