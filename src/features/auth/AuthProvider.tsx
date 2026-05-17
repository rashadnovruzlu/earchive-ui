import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import { AUTH_STORAGE_KEY, api } from '../../lib/api';
import type { LoginPayload, LoginResponse } from '../../types/api';

type AuthContextValue = {
  session: LoginResponse | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<LoginResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      setSession(JSON.parse(stored) as LoginResponse);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login: async (payload) => {
        const response = await api.login(payload);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));
        setSession(response);
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}