export interface CreateUserDto {
  username: string;
  roleId: number;
  userTypeId: number;
  personId: number;
  password?: string;
}

export interface CreatedUser {
  success: boolean;
  message: string;
  tempPassword: string;
  userId?: number;
}

export interface ResetLoginResult {
  success?: boolean;
  message?: string;
  tempPassword?: string;
}

export interface UserListItem {
  id: number;
  username: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  photoUrl: string | null;
  roleId: number;
  roleName: string;
  roleDescription: string;
  userTypeId: number;
  userTypeCode: string;
  userTypeName: string;
  userTypeDescription: string;
  isActive: boolean;
  firstLogin: boolean;
}

export interface FindUsersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  fullName?: string;
  roleName?: string;
  userTypeName?: string;
  isActive?: boolean;
  isFirstLogin?: boolean;
}
