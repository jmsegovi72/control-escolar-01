import type {
  AddressInfo,
  AddressListItem,
  CreateAddressDto,
  UpdateAddressDto,
} from '~/types/address.types';
import type { ApiResponse } from '~/types/api.types';
import { apiClient } from '../api.client';

export const addressService = {
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
};
