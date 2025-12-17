import { apiClient } from "./apiClient";

export function getPublicEvent(slug) {
  const targetSlug = slug || import.meta.env.VITE_DEFAULT_EVENT_SLUG || "main-event";
  return apiClient(`/event/public/${targetSlug}`);
}

export function getEventStats(token) {
  return apiClient("/event/stats", { token });
}

export function getEventSettings(token) {
  return apiClient("/event/settings", { token });
}

export function updateEventSettings(token, updates) {
  return apiClient("/event/settings", {
    method: "PUT",
    token,
    data: updates,
  });
}

export function openRegistration(token) {
  return apiClient("/event/open", { method: "POST", token });
}

export function closeRegistration(token, reason) {
  return apiClient("/event/close", {
    method: "POST",
    token,
    data: { reason },
  });
}
