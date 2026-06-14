export interface LoginCredentials {
  login: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  photoUrl: string | null;
  gender?: 'H' | 'M';
  roleId: number;
  roleName: string;
  roleDescription: string;
  userTypeId: number;
  userTypeCode: 'SUPER' | 'CE' | string;
  userTypeName: string;
  userTypeDescription: string;
  isActive: boolean;
  firstLogin: boolean;
}

export type PermissionsMap = Record<string, ('read' | 'write')[]>;

export interface AuthResponse {
  user: User;
  token: string;
  permissions?: PermissionsMap;
}

export interface FirstLoginResponse {
  success: false;
  message: string;
  token: string;
  data: {
    requiresPasswordChange: true;
  };
}

export type LoginResponse = AuthResponse | FirstLoginResponse;

export function isFirstLoginResponse(
  response: LoginResponse,
): response is FirstLoginResponse {
  return 'data' in response && response.data?.requiresPasswordChange === true;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: true;
  message: string;
  token: string;
  data: {
    user: User;
  };
}

export type SessionKind = 'authenticated' | 'password-change';
