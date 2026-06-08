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
