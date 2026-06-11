import type { ApiResponse } from '~/types/api.types';
import type {
  CreatePersonDto,
  FindPersonsParams,
  PersonListItem,
  UpdatePersonDto,
} from '~/types/person.types';
import { apiClient } from '../api.client';

export const personService = {
  async findMany(
    params: FindPersonsParams = {},
  ): Promise<ApiResponse<PersonListItem[]>> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.firstName) query.set('firstName', params.firstName);
    if (params.firstLastName) query.set('firstLastName', params.firstLastName);
    if (params.secondLastName)
      query.set('secondLastName', params.secondLastName);
    if (params.fullName) query.set('fullName', params.fullName);
    if (params.curp) query.set('curp', params.curp);
    if (params.stateName) query.set('stateName', params.stateName);
    if (params.municipalityName)
      query.set('municipalityName', params.municipalityName);
    if (params.isActive !== undefined)
      query.set('isActive', String(params.isActive));

    const response = await apiClient.get<ApiResponse<PersonListItem[]>>(
      `/persons/query?${query.toString()}`,
    );
    return response.data;
  },

  async findOne(search: string | number): Promise<PersonListItem> {
    const response = await apiClient.get<
      ApiResponse<PersonListItem> | PersonListItem
    >(`/persons/${search}`);

    return 'data' in response.data ? response.data.data : response.data;
  },

  async create(dto: CreatePersonDto): Promise<PersonListItem> {
    const response = await apiClient.post<PersonListItem>('/persons', dto);
    return response.data;
  },

  async update(
    id: number,
    dto: UpdatePersonDto,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/persons/${id}`,
      dto,
    );
    return response.data;
  },
};
