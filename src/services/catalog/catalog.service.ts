import type { ApiResponse } from '~/types/api.types';
import type { Role, UserType } from '~/types/catalog.types';
import { apiClient } from '../api.client';

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
};
