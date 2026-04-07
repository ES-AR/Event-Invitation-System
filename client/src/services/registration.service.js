import { apiClient } from "./apiClient";

export function submitRegistration(payload) {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  return apiClient("/registration", {
    method: "POST",
    data: payload,
    isFormData,
  });
}

export function fetchAttendees(params = {}, token) {
  return apiClient("/registration/list", {
    query: params,
    token,
  });
}

export function approveAttendee(id, token) {
  return apiClient(`/registration/approve/${id}`, {
    method: "PUT",
    token,
  });
}

export function rejectAttendee(id, token) {
  return apiClient(`/registration/reject/${id}`, {
    method: "PUT",
    token,
  });
}

export function deleteAttendee(id, token) {
  return apiClient(`/registration/${id}`, {
    method: "DELETE",
    token,
  });
}

export function bulkApprove(body, token) {
  return apiClient("/registration/bulk/approve", {
    method: "POST",
    data: body,
    token,
  });
}

export function bulkReject(body, token) {
  return apiClient("/registration/bulk/reject", {
    method: "POST",
    data: body,
    token,
  });
}

export function bulkDelete(body, token) {
  return apiClient("/registration/bulk/delete", {
    method: "POST",
    data: body,
    token,
  });
}

export function exportAttendeesCsv(params = {}, token) {
  return apiClient("/registration/export/csv", {
    query: params,
    token,
    headers: { Accept: "text/csv" },
  });
}

export function exportAttendeesPdf(params = {}, token) {
  return apiClient("/registration/export/pdf", {
    query: params,
    token,
    headers: { Accept: "application/pdf" },
    responseType: "blob",
  });
}

