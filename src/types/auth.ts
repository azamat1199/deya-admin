export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * The API is backed by DRF SimpleJWT (confirmed via its error response shape),
 * so a successful login is expected to return access + refresh tokens.
 * Adjust this if the real response differs.
 */
export interface LoginResponse {
  access: string;
  refresh?: string;
  user?: AuthUser;
}

export interface AuthUser {
  id: number | string;
  username: string;
  email?: string;
  role?: string;
}

export interface ApiErrorResponse {
  detail?: string;
  [field: string]: string | string[] | undefined;
}
