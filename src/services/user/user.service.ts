import type { ApiResponse } from '~/types/api.types';
import type { Person } from '~/types/person.types';
import type {
  CreatedUser,
  CreateUserDto,
  FindUsersParams,
  ResetLoginResult,
  UserListItem,
} from '~/types/user.types';
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

  async findMany(
    params: FindUsersParams = {},
  ): Promise<ApiResponse<UserListItem[]>> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.fullName) query.set('fullName', params.fullName);
    if (params.roleName) query.set('roleName', params.roleName);
    if (params.userTypeName) query.set('userTypeName', params.userTypeName);
    if (params.isActive !== undefined) {
      query.set('isActive', String(params.isActive));
    }
    if (params.isFirstLogin !== undefined) {
      query.set('isFirstLogin', String(params.isFirstLogin));
    }

    const response = await apiClient.get<ApiResponse<UserListItem[]>>(
      `/users/query?${query.toString()}`,
    );
    return response.data;
  },

  async findById(id: number): Promise<UserListItem> {
    const response = await apiClient.get<
      ApiResponse<UserListItem> | UserListItem
    >(`/users/${id}`);

    return 'data' in response.data ? response.data.data : response.data;
  },

  async resetLogin(id: number): Promise<ResetLoginResult> {
    const response = await apiClient.patch<
      ApiResponse<ResetLoginResult> | ResetLoginResult
    >(`/users/reset-login/${id}`);

    return 'data' in response.data ? response.data.data : response.data;
  },

  async updateUser(
    id: number,
    dto: { username: string; roleId: number; userTypeId: number },
  ): Promise<any> {
    const response = await apiClient.patch<any>(`/users/${id}`, dto);
    return response.data;
  },
};
