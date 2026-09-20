import { createContext } from "react";
import type { AuthUser, LoginRequest } from "../types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Drops the local session WITHOUT calling the API — for the case where
   * the token is already dead server-side and any request would 401.
   * Set-password blacklists every session, so calling logout() after it
   * would hit that 401 and trip the response interceptor's hard
   * window.location redirect. Use logout() for an ordinary sign-out.
   */
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
