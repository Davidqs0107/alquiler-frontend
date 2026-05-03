import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, LoginRequest, MembershipRole, BranchMembership } from '@/types';
import { authApi } from '@/api';
import { getErrorMessage } from '@/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  clearError: () => void;
  error: string | null;
  getMyCompanyId: () => string | null;
  getMyCompanyRole: () => MembershipRole | null;
  getMyBranches: () => BranchMembership[];
  hasRole: (role: MembershipRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'user';
const TOKEN_KEY = 'accessToken';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    authApi.me().then(fullUser => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
      setState({ user: fullUser, isAuthenticated: true, isLoading: false });
    }).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    });
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setError(null);
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.accessToken);

      const fullUser = await authApi.me();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser));
      setState({ user: fullUser, isAuthenticated: true, isLoading: false });
      return fullUser;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getMyCompanyId = useCallback((): string | null => {
    if (!state.user?.memberships?.length) return null;
    return state.user.memberships[0].companyId;
  }, [state.user?.memberships]);

  const getMyCompanyRole = useCallback((): MembershipRole | null => {
    if (!state.user?.memberships?.length) return null;
    return state.user.memberships[0].companyRole;
  }, [state.user?.memberships]);

  const getMyBranches = useCallback((): BranchMembership[] => {
    if (!state.user?.memberships?.length) return [];
    return state.user.memberships[0].branches;
  }, [state.user?.memberships]);

  const hasRole = useCallback((role: MembershipRole): boolean => {
    return getMyCompanyRole() === role;
  }, [getMyCompanyRole]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearError,
        error,
        getMyCompanyId,
        getMyCompanyRole,
        getMyBranches,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}