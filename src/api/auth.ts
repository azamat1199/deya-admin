import { apiClient } from "./client";
import type { LoginRequest, LoginResponse } from "../types/auth";

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/v1/auth/login/", payload),

  logout: () => apiClient.post("/api/v1/auth/logout/"),
};
