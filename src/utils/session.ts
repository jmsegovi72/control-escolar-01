import type {
  AuthResponse,
  FirstLoginResponse,
  SessionKind,
  User,
} from '~/types/auth.types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SESSION_KIND_KEY = 'sessionKind';

const canUseStorage = () => typeof window !== 'undefined';

export const sessionStore = {
  saveTemporarySession(response: FirstLoginResponse): void {
    if (!canUseStorage()) return;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(SESSION_KIND_KEY, 'password-change');
  },

  saveAuthenticatedSession(response: AuthResponse): void {
    if (!canUseStorage()) return;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(SESSION_KIND_KEY, 'authenticated');
  },

  clear(): void {
    if (!canUseStorage()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KIND_KEY);
  },

  getToken(): string | null {
    if (!canUseStorage()) return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    if (!canUseStorage()) return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getSessionKind(): SessionKind | null {
    if (!canUseStorage()) return null;
    const kind = localStorage.getItem(SESSION_KIND_KEY);
    return kind === 'authenticated' || kind === 'password-change' ? kind : null;
  },

  hasAuthenticatedSession(): boolean {
    return (
      !!this.getToken() &&
      !!this.getUser() &&
      this.getSessionKind() === 'authenticated'
    );
  },

  hasPasswordChangeSession(): boolean {
    return !!this.getToken() && this.getSessionKind() === 'password-change';
  },
};
