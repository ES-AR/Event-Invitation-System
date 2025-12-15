// event.service.js
import { apiRequest } from "./api";

const adminHeaders = () => {
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  return adminKey ? { "x-admin-key": adminKey } : {};
};

// Fetch current event settings (quota, status, etc.)
export function getEventSettings() {
  return apiRequest("/event/settings");
}

// Update event settings (admin only)
export function updateEventSettings(payload) {
  return apiRequest("/event/settings", "PUT", payload, adminHeaders());
}

// Close registration manually
export function closeRegistration() {
  return apiRequest("/event/close", "POST", {}, adminHeaders());
}

// Get dashboard statistics (for Admin Dashboard)
export function getDashboardStats() {
  return apiRequest("/event/stats", "GET", null, adminHeaders());
}
