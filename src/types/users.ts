export interface CreateUserPayload {
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role: number;
}

/**
 * Role ids as expected by POST /api/v1/admin/user/create/. Exact label
 * mapping unconfirmed — Swagger was behind auth we couldn't reach to
 * confirm the choices, so these are a reasonable guess. Adjust once the
 * backend's real role choices are known; the labels below are the only
 * thing that needs editing.
 */
export const USER_ROLES = [
  { value: 0, labelKey: "roleAdmin" },
  { value: 1, labelKey: "roleManager" },
  { value: 2, labelKey: "roleStaff" },
] as const;
