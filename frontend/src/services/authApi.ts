import type { AuthCredentials, AuthUser } from '../types/auth';
import { http } from './http';

export const authApi = {
  me: () => http<AuthUser>('/auth/me'),

  login: (credentials: AuthCredentials) =>
    http<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (credentials: AuthCredentials) =>
    http<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    http<void>('/auth/logout', {
      method: 'POST',
    }),
};
