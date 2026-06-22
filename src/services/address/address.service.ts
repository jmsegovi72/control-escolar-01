import type {
  AddressInfo,
  AddressListItem,
  CreateAddressDto,
  FindAddressesParams,
  UpdateAddressDto,
} from '~/types/address.types';
import type { ApiResponse } from '~/types/api.types';
import { apiClient } from '../api.client';

export const addressService = {
  async findMany(
    params: FindAddressesParams = {},
  ): Promise<ApiResponse<AddressListItem[]>> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.fullName) query.set('fullName', params.fullName);
    if (params.stateName) query.set('stateName', params.stateName);
    if (params.municipalityName)
      query.set('municipalityName', params.municipalityName);
    if (params.zipCode) query.set('zipCode', params.zipCode);
    if (params.street) query.set('street', params.street);
    if (params.settlement) query.set('settlement', params.settlement);

    const response = await apiClient.get<ApiResponse<AddressListItem[]>>(
      `/addresses/query?${query.toString()}`,
    );
    return response.data;
  },

  async create(dto: CreateAddressDto): Promise<AddressInfo> {
    const response = await apiClient.post<ApiResponse<AddressInfo>>(
      '/addresses',
      dto,
    );
    return response.data.data;
  },

  async findOne(search: string | number): Promise<AddressListItem | null> {
    try {
      const response = await apiClient.get<ApiResponse<AddressListItem>>(
        `/addresses/${search}`,
      );
      return response.data.data ?? null;
    } catch {
      return null;
    }
  },

  async update(id: number, dto: UpdateAddressDto): Promise<AddressInfo> {
    const response = await apiClient.patch<ApiResponse<AddressInfo>>(
      `/addresses/${id}`,
      dto,
    );
    return response.data.data;
  },

  async createMany(dto: { addresses: CreateAddressDto[] }): Promise<void> {
    await apiClient.post('/addresses/batch', dto);
  },
};
