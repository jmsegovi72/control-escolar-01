import type { ApiResponse } from '~/types/api.types';
import type { Person } from '~/types/person.types';
import type { CreatedUser, CreateUserDto } from '~/types/user.types';
import { apiClient } from '../api.client';

export const userService = {
  async searchPersons(fullName: string): Promise<Person[]> {
    const response = await apiClient.get<ApiResponse<Person[]>>(
      `/persons/query?fullName=${encodeURIComponent(fullName)}`,
    );
    return response.data.data;
  },

  async createUser(dto: CreateUserDto): Promise<CreatedUser> {
    const response = await apiClient.post<CreatedUser>('/users', dto);
    return response.data;
  },

  async uploadPhoto(id: number, photo: File): Promise<void> {
    const formData = new FormData();
    formData.append('photo', photo);

    await apiClient.patch(`/users/photo/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
