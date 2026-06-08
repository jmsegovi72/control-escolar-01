import type { LoginCredentials } from '~/types/auth.types';

export type BackendLoginRequest = {
  login: string;
  password: string;
};

export function toBackendLoginRequest(
  credentials: LoginCredentials,
): BackendLoginRequest {
  return {
    login: credentials.login.trim(),
    password: credentials.password,
  };
}
