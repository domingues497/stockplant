import { apiFetch } from "./client";

export type NewUser = { username: string; email?: string; password: string; role: "PRODUTOR" | "CLIENTE" };
export type UserRow = { id: number; username: string; email: string; role: string; is_active: boolean };

export async function adminCreateUser(payload: NewUser): Promise<UserRow> {
  return apiFetch("/api/auth/admin/users/", { method: "POST", body: JSON.stringify(payload) });
}

export async function adminListUsers(role?: "PRODUTOR" | "CLIENTE" | "ADMIN"): Promise<UserRow[]> {
  const suffix = role ? `?role=${role}` : "";
  return apiFetch(`/api/auth/admin/users/${suffix}`);
}

export async function adminUpdateUser(id: number, payload: Partial<Pick<UserRow, "role" | "is_active">>): Promise<UserRow> {
  return apiFetch(`/api/auth/admin/users/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

