// registration.service.js
import { apiRequest } from "./api";

// Public Registration
export function registerAttendee(payload) {
  return apiRequest("/registration", "POST", payload);
}

// Fetch all attendees (admin)
export function getAttendees() {
  return apiRequest("/registration/list");
}

// Approve a pending attendee
export function approveAttendee(id) {
  return apiRequest(`/registration/approve/${id}`, "PUT");
}

// Remove attendee
export function deleteAttendee(id) {
  return apiRequest(`/registration/${id}`, "DELETE");
}

// Send personalized check‑in email
export function sendCheckInEmail(id) {
  return apiRequest(`/registration/send-checkin/${id}`, "POST");
}

// Check-in submission (photo upload + data)
export async function submitCheckIn(token, formData) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/checkin/${token}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Check‑in failed");

    return data;
  } catch (error) {
    console.error("Check‑in API Error:", error.message);
    throw error;
  }
}
