import { apiFetch } from './api';

export const authService = {
  async login({ email, password }) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) localStorage.setItem('token', data.token);
    return data?.user ?? null;
  },

  async logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async me() {
    return apiFetch('/auth/me');
  },
};
