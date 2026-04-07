import { apiClient } from "./apiClient";

export async function loginAdmin(credentials) {
  const payload = await apiClient("/auth/login", {
    method: "POST",
    data: credentials,
  });
  return payload;
}

export async function registerAdmin(data) {
  const payload = await apiClient("/auth/register", {
    method: "POST",
    data,
  });
  return payload;
}

export async function fetchProfile(token) {
  const { admin } = await apiClient("/auth/me", {
    token,
  });
  return admin;
}
