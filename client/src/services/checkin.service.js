import { apiClient } from "./apiClient";

const withTokenHeader = (token) => ({
  headers: token
    ? {
        "X-Checkin-Token": token,
      }
    : {},
});

export function startCheckInSession(slug, token) {
  return apiClient(`/checkin/${slug}/session`, {
    method: "POST",
    data: { token },
    ...withTokenHeader(token),
  });
}

export function searchCheckInAttendees(slug, query, token, signal) {
  return apiClient(`/checkin/${slug}/attendees`, {
    query: { q: query },
    signal,
    ...withTokenHeader(token),
  });
}

export function fetchCheckInAttendee(slug, attendeeId, token) {
  return apiClient(`/checkin/${slug}/attendees/${attendeeId}`, {
    ...withTokenHeader(token),
  });
}

export function markCheckIn(slug, attendeeId, token) {
  return apiClient(`/checkin/${slug}/attendees/${attendeeId}/checkin`, {
    method: "POST",
    ...withTokenHeader(token),
  });
}

export function undoCheckIn(slug, attendeeId, token) {
  return apiClient(`/checkin/${slug}/attendees/${attendeeId}/undo`, {
    method: "POST",
    ...withTokenHeader(token),
  });
}
