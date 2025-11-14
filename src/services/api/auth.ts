import { apiFetch } from "./client";

export async function authLogin(username: string, password: string) {
  const data = await apiFetch("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export function authLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/auth";
}

export async function authMe() {
  return apiFetch("/api/auth/me/");
}
