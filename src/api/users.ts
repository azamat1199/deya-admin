import { apiClient } from "./client";
import type { CreateUserPayload, SetPasswordPayload } from "../types/users";

// Only endpoint the backend exposes for this resource — no list, edit, or
// delete. The success toast on the Users page is built from the submitted
// form values, not this response, so its shape doesn't need to be known.
export const usersApi = {
  createUser: (payload: CreateUserPayload) =>
    apiClient.post<unknown>("/api/v1/admin/user/create/", payload),

  /**
   * Sets the CURRENT user's password — requires a valid token (an
   * unauthenticated call returns 401, so this can never run from /login).
   *
   * Returns 200 with NO body, hence `void`: nothing here parses a response.
   * It also blacklists every existing session, so the caller's token is
   * dead the moment this resolves — do not issue further requests after it.
   */
  setPassword: (payload: SetPasswordPayload) =>
    apiClient.post<void>("/api/v1/user/set-password/", payload),
};
