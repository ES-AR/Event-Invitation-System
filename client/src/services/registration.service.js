import { apiClient } from "./apiClient";

export function requestCaptcha() {
  return apiClient("/registration/captcha");
}

export function submitRegistration(payload) {
  return apiClient("/registration", {
    method: "POST",
    data: payload,
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

export function bulkDelete(body, token) {
  return apiClient("/registration/bulk/delete", {
    method: "POST",
    data: body,
    token,
  });
}

export function getCheckInDetails(token) {
  return apiClient(`/registration/checkin/${token}`);
}

export function submitCheckIn(token, payload) {
  return apiClient(`/registration/checkin/${token}`, {
    method: "POST",
    data: payload,
    isFormData: true,
  });
}
