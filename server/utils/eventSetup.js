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

export async function ensureEventDocument() {
  let event = await Event.findOne();

  if (!event) {
    event = await Event.create({
      title: "Quota-Controlled Event",
      description: "",
      location: "",
      publicSlug: DEFAULT_EVENT_SLUG,
    });
  } else if (!event.publicSlug) {
    event.publicSlug = DEFAULT_EVENT_SLUG;
    await event.save();
  }

  return event;
}
