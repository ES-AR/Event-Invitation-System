import crypto from "crypto";
import Event from "../models/Event.js";

export const DEFAULT_EVENT_SLUG = process.env.DEFAULT_EVENT_SLUG || "main-event";

export function normalizeSlug(value = DEFAULT_EVENT_SLUG) {
  if (!value || typeof value !== "string") {
    return DEFAULT_EVENT_SLUG;
  }

  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || DEFAULT_EVENT_SLUG;

  return cleaned;
}

function notFoundError() {
  const error = new Error("Event not found");
  error.statusCode = 404;
  return error;
}

export async function requireOrganizerEvent(adminId, eventId) {
  if (!adminId) {
    const error = new Error("Organizer context is missing");
    error.statusCode = 401;
    throw error;
  }

  if (!eventId) {
    const error = new Error("Event id is required");
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findOne({ _id: eventId, organizer: adminId });
  if (!event) {
    throw notFoundError();
  }
  return event;
}

const randomPrefix = (size = 4) => crypto.randomBytes(size).toString("hex").slice(0, size);

export async function generateUniqueSlug(preferred, excludeId, options = {}) {
  const { forcePrefixedSuggestion = false } = options;
  const base = normalizeSlug(preferred);
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  const baseAvailable = !(await Event.exists({ publicSlug: base, ...filter }));

  if (baseAvailable && !forcePrefixedSuggestion) {
    return base;
  }

  let slug;
  let attempt = 0;
  do {
    const prefix = randomPrefix();
    slug = `${prefix}-${base}`;
    attempt += 1;

    if (attempt > 25) {
      // fallback to timestamped prefix to avoid tight loop
      slug = `${Date.now().toString(36)}-${base}`;
    }
  } while (await Event.exists({ publicSlug: slug, ...filter }));

  return slug;
}
