import type { ApiResponse } from '~/types/api.types';
import type {
  CreatePersonDto,
  FindPersonsParams,
  PersonListItem,
  PersonSearchCatalogs,
  UpdatePersonDto,
  ViewPerson,
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
    if (params.gender) query.set('gender', params.gender);
    if (params.isActive !== undefined)
      query.set('isActive', String(params.isActive));
    if (params.hasAddress !== undefined)
      query.set('hasAddress', String(params.hasAddress));
    if (params.hasDemographic !== undefined)
      query.set('hasDemographic', String(params.hasDemographic));
    if (params.hasEmergencyContact !== undefined)
      query.set('hasEmergencyContact', String(params.hasEmergencyContact));

    const response = await apiClient.get<ApiResponse<PersonListItem[]>>(
      `/persons/query?${query.toString()}`,
    );
    return response.data;
  },

  async findOne(search: string | number): Promise<ViewPerson> {
    const response = await apiClient.get<ApiResponse<ViewPerson> | ViewPerson>(
      `/persons/${search}`,
    );

    return 'data' in response.data ? response.data.data : response.data;
  },

  async create(dto: CreatePersonDto): Promise<ViewPerson> {
    const response = await apiClient.post<ApiResponse<ViewPerson>>(
      '/persons',
      dto,
    );
    return response.data.data;
  },

  async update(id: number, dto: UpdatePersonDto): Promise<ViewPerson> {
    const response = await apiClient.patch<ApiResponse<ViewPerson>>(
      `/persons/${id}`,
      dto,
    );
    return response.data.data;
  },

  async getSearchCatalogs(): Promise<PersonSearchCatalogs> {
    const response = await apiClient.get<ApiResponse<PersonSearchCatalogs>>(
      '/persons/search-catalogs',
    );
    return response.data.data;
  },

  async createMany(dto: { persons: CreatePersonDto[] }): Promise<void> {
    await apiClient.post('/persons/batch', dto);
  },

  async uploadPhoto(id: number, photo: File): Promise<void> {
    const formData = new FormData();
    formData.append('photo', photo);
    await apiClient.patch(`/persons/photo/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
