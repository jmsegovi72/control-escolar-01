import type { ApiResponse } from '~/types/api.types';
import type {
  CreateDemographicDto,
  FindDemographicsParams,
  UpdateDemographicDto,
  ViewDemographic,
} from '~/types/demographic.types';
import { apiClient } from '../api.client';

export const demographicService = {
  async create(dto: CreateDemographicDto): Promise<ViewDemographic> {
    const response = await apiClient.post<ApiResponse<ViewDemographic>>(
      '/demographics',
      dto,
    );
    return response.data.data;
  },

  async findOne(search: string | number): Promise<ViewDemographic | null> {
    try {
      const response = await apiClient.get<ApiResponse<ViewDemographic>>(
        `/demographics/${search}`,
      );
      return response.data.data ?? null;
    } catch {
      return null;
    }
  },

  async findMany(
    params: FindDemographicsParams = {},
  ): Promise<ApiResponse<ViewDemographic[]>> {
    const query = new URLSearchParams();

    if (params.fullName) query.set('fullName', params.fullName);
    if (params.gender) query.set('gender', params.gender);
    if (params.maritalStatus) query.set('maritalStatus', params.maritalStatus);
    if (params.indigenousLanguage) {
      query.set('indigenousLanguage', params.indigenousLanguage);
    }
    if (params.foreignLanguage) {
      query.set('foreignLanguage', params.foreignLanguage);
    }
    if (params.specialCondition) {
      query.set('specialCondition', params.specialCondition);
    }
    if (params.isIndigenous !== undefined) {
      query.set('isIndigenous', String(params.isIndigenous));
    }
    if (params.isAfroDescendant !== undefined) {
      query.set('isAfroDescendant', String(params.isAfroDescendant));
    }
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.page) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const response = await apiClient.get<ApiResponse<ViewDemographic[]>>(
      `/demographics/query?${query.toString()}`,
    );
    return response.data;
  },

  async update(
    id: number,
    dto: UpdateDemographicDto,
  ): Promise<ViewDemographic> {
    const response = await apiClient.patch<ApiResponse<ViewDemographic>>(
      `/demographics/${id}`,
      dto,
    );
    return response.data.data;
  },
};
