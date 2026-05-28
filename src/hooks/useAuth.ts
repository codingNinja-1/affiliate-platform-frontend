import { useCallback, useState } from 'react';

export type AuthUser = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  referral_code?: string;
  [key: string]: unknown;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  refresh: () => void;
  logout: () => void;
};

const STORAGE_USER_KEY = 'user';
const STORAGE_TOKEN_KEY = 'auth_token';

function readUser(): AuthUser | null {
  const raw = typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch (err) {
    console.warn('Failed to parse stored user', err);
    return null;
  }
}

function readToken(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return readUser();
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return readToken();
  });
  const hydrated = typeof window !== 'undefined';

  const refresh = useCallback(() => {
    setUser(readUser());
    setToken(readToken());
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    hydrated,
    refresh,
    logout,
  };
}
