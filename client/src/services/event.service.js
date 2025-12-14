// event.service.js
import { apiRequest } from "./api";

// Fetch current event settings (quota, status, etc.)
export function getEventSettings() {
  return apiRequest("/event/settings");
}

// Update event settings (admin only)
export function updateEventSettings(payload) {
  return apiRequest("/event/settings", "PUT", payload);
}

// Close registration manually
export function closeRegistration() {
  return apiRequest("/event/close", "POST");
}

// Get dashboard statistics (for Admin Dashboard)
export function getDashboardStats() {
  return apiRequest("/event/stats");
}
