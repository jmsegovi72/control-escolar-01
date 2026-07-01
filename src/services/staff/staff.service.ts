import type { StaffQueryResponse } from '~/types/staff.types';
import { apiClient } from '../api.client';

export const staffService = {
  async findMany(searchTerm: string, limit = 8, page = 1) {
    const query = new URLSearchParams();
    query.set('searchTerm', searchTerm);
    query.set('limit', String(limit));
    query.set('page', String(page));

    const response = await apiClient.get<StaffQueryResponse>(
      `/staff/query?${query.toString()}`,
    );
    return response.data;
  },

  async findOne(id: number) {
    const response = await apiClient.get<{ data: any } | any>(`/staff/${id}`);
    return 'data' in response.data ? response.data.data : response.data;
  },
};
