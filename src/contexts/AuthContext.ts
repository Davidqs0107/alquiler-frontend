import { create } from 'zustand';
import type { User, LoginRequest } from '@/types';
import { authApi } from '@/api';
import { getErrorMessage } from '@/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getInitialState(): AuthState {
  const token = getStoredToken();
  const user = getStoredUser();
  return {
    user,
    isAuthenticated: !!(token && user),
    isLoading: false,
    error: null,
  };
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...getInitialState(),

  login: async (credentials) => {
    set({ error: null, isLoading: true });
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  return { user, isAuthenticated, isLoading, error, login, logout, clearError };
};