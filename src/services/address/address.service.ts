import type {
  AddressListItem,
  CreateAddressDto,
  UpdateAddressDto,
} from '~/types/address.types';
import type { ApiResponse } from '~/types/api.types';
import { apiClient } from '../api.client';

export const addressService = {
  async create(dto: CreateAddressDto): Promise<void> {
    await apiClient.post('/addresses', dto);
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

  async update(id: number, dto: UpdateAddressDto): Promise<void> {
    await apiClient.patch(`/addresses/${id}`, dto);
  },
};
