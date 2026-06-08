import axios, { AxiosError } from 'axios';

import { ENV } from '~/config/env';
import { sessionStore } from '~/utils/session';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const isLoginRoute = config.url?.includes('/auth/login');

  if (isLoginRoute) {
    return config;
  }

  const token = sessionStore.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== 'undefined') {
      const isLoginRoute = error.config?.url?.includes('/auth/login');

      if (error.response?.status === 401 && !isLoginRoute) {
        const expiredReason =
          sessionStore.getSessionKind() === 'password-change'
            ? 'temporary'
            : 'session';

        sessionStore.clear();
        window.location.href = `/login?expired=${expiredReason}`;
      }
    }

    return Promise.reject(error);
  },
);
