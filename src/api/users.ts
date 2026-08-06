import { apiClient } from "./client";
import type { CreateUserPayload } from "../types/users";

// Only endpoint the backend exposes for this resource — no list, edit, or
// delete. The success toast on the Users page is built from the submitted
// form values, not this response, so its shape doesn't need to be known.
export const usersApi = {
  createUser: (payload: CreateUserPayload) =>
    apiClient.post<unknown>("/api/v1/admin/user/create/", payload),
};
