import { useState, useCallback, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { clearToken, getToken, setToken } from "../utils/token";
import type { AuthUser, LoginRequest } from "../types/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));

  const login = useCallback(async (payload: LoginRequest) => {
    const { data } = await authApi.login(payload);
    setToken(data.access);
    setUser(data.user ?? { id: 0, username: payload.username });
    setHasToken(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network/API errors on logout — clear local state regardless
    }
    clearToken();
    setUser(null);
    setHasToken(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: hasToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
