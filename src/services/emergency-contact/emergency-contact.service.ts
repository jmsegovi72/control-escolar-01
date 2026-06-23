import type { ApiResponse } from '~/types/api.types';
import type {
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
  ViewEmergencyContact,
} from '~/types/emergency-contact.types';
import { apiClient } from '../api.client';

export const emergencyContactService = {
  async create(dto: CreateEmergencyContactDto): Promise<ViewEmergencyContact> {
    const response = await apiClient.post<ApiResponse<ViewEmergencyContact>>(
      '/emergency-contacts',
      dto,
    );
    return response.data.data;
  },

  async createMany(dto: {
    emergencyContacts: CreateEmergencyContactDto[];
  }): Promise<void> {
    await apiClient.post('/emergency-contacts/bulk', dto);
  },

  async findOne(search: string | number): Promise<ViewEmergencyContact | null> {
    try {
      const response = await apiClient.get<ApiResponse<ViewEmergencyContact>>(
        `/emergency-contacts/${search}`,
      );
      return response.data.data ?? null;
    } catch {
      return null;
    }
  },

  async update(
    id: number,
    dto: UpdateEmergencyContactDto,
  ): Promise<ViewEmergencyContact> {
    const response = await apiClient.patch<ApiResponse<ViewEmergencyContact>>(
      `/emergency-contacts/${id}`,
      dto,
    );
    return response.data.data;
  },
};
