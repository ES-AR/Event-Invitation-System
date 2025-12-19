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

export async function generateUniqueSlug(preferred, excludeId) {
  const base = normalizeSlug(preferred);
  let slug = base;
  let attempt = 1;
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  while (await Event.exists({ publicSlug: slug, ...filter })) {
    slug = `${base}-${attempt++}`;
  }

  return slug;
}
