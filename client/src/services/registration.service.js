// registration.service.js
import { apiRequest } from "./api";

const adminHeaders = () => {
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  return adminKey ? { "x-admin-key": adminKey } : {};
};

// Public Registration
export function registerAttendee(payload) {
  return apiRequest("/registration", "POST", payload);
}

// Fetch all attendees (admin)
export function getAttendees() {
  return apiRequest("/registration/list", "GET", null, adminHeaders());
}

// Approve a pending attendee
export function approveAttendee(id) {
  return apiRequest(`/registration/approve/${id}`, "PUT", {}, adminHeaders());
}

// Remove attendee
export function deleteAttendee(id) {
  return apiRequest(`/registration/${id}`, "DELETE", null, adminHeaders());
}

// Send personalized check‑in email
export function sendCheckInEmail(id) {
  return apiRequest(`/registration/send-checkin/${id}`, "POST", {}, adminHeaders());
}

// Check-in submission (JSON payload)
export function submitCheckIn(token, payload) {
  return apiRequest(`/registration/checkin/${token}`, "POST", payload);
}
