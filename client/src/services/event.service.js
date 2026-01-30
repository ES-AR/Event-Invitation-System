import { apiClient } from "./apiClient";

export function getPublicEvent(slug) {
  const targetSlug = slug || import.meta.env.VITE_DEFAULT_EVENT_SLUG || "main-event";
  return apiClient(`/event/public/${targetSlug}`);
}

export function listEvents(token) {
  return apiClient("/event", { token });
}

export function createEvent(token, payload) {
  return apiClient("/event", {
    method: "POST",
    token,
    data: payload,
  });
}

export function checkSlugAvailability(token, slug, eventId) {
  const params = new URLSearchParams();
  if (slug) params.set("slug", slug);
  if (eventId) params.set("eventId", eventId);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return apiClient(`/event/slug/check${suffix}`, { token });
}

export function getEvent(eventId, token) {
  return apiClient(`/event/${eventId}`, { token });
}

export function updateEvent(eventId, token, updates) {
  return apiClient(`/event/${eventId}`, {
    method: "PUT",
    token,
    data: updates,
  });
}

export function deleteEvent(eventId, token) {
  return apiClient(`/event/${eventId}`, {
    method: "DELETE",
    token,
  });
}

export function getEventStats(eventId, token) {
  return apiClient(`/event/${eventId}/stats`, { token });
}

export function openRegistration(eventId, token) {
  return apiClient(`/event/${eventId}/open`, { method: "POST", token });
}

export function closeRegistration(eventId, token, reason) {
  return apiClient(`/event/${eventId}/close`, {
    method: "POST",
    token,
    data: { reason },
  });
}

export function issueCheckInToken(eventId, token) {
  return apiClient(`/event/${eventId}/checkin/token`, {
    method: "POST",
    token,
  });
}
