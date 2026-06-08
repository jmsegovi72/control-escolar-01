import type {
  ChangePasswordCredentials,
  ChangePasswordResponse,
  LoginCredentials,
  LoginResponse,
} from '~/types/auth.types';
import { isFirstLoginResponse } from '~/types/auth.types';
import { sessionStore } from '~/utils/session';
import { apiClient } from '../api.client';
import { toBackendLoginRequest } from './auth.mapper';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const payload = toBackendLoginRequest(credentials);

    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      payload,
    );
    return response.data;
  },

  async changePassword(
    data: ChangePasswordCredentials,
  ): Promise<ChangePasswordResponse> {
    const response = await apiClient.patch<ChangePasswordResponse>(
      '/auth/change-password',
      data,
    );
    return response.data;
  },

  saveSession(response: LoginResponse): void {
    if (isFirstLoginResponse(response)) {
      sessionStore.saveTemporarySession(response);
      return;
    }

    sessionStore.saveAuthenticatedSession(response);
  },

  saveChangedPasswordSession(response: ChangePasswordResponse): void {
    sessionStore.saveAuthenticatedSession({
      token: response.token,
      user: response.data.user,
    });
  },

  logout(): void {
    sessionStore.clear();
  },

  isAuthenticated(): boolean {
    return sessionStore.hasAuthenticatedSession();
  },

  requiresPasswordChange(): boolean {
    return sessionStore.hasPasswordChangeSession();
  },
};
