import Event from "../models/Event.js";
import { normalizeSlug } from "../utils/eventSetup.js";
import { hashCheckInToken } from "../utils/helpers.js";

const tokenSources = [
  (req) => req.headers["x-checkin-token"],
  (req) => req.get?.("x-checkin-token"),
  (req) => req.body?.token,
  (req) => req.query?.token,
];

export default async function requireCheckIn(req, res, next) {
  try {
    const slugSource = req.params?.slug || req.body?.slug || req.query?.slug;
    if (!slugSource) {
      return res.status(400).json({ message: "Event slug is required" });
    }

    const slug = normalizeSlug(slugSource);
    const tokenValue = tokenSources
      .map((picker) => picker?.(req))
      .find((value) => typeof value === "string" && value.trim().length > 0);

    if (!tokenValue) {
      return res.status(401).json({ message: "Check-in token required" });
    }

    const event = await Event.findOne({ publicSlug: slug });
    if (!event || !event.checkInTokenHash) {
      return res.status(404).json({ message: "Check-in has not been enabled for this event" });
    }

    const hashed = hashCheckInToken(tokenValue);
    if (hashed !== event.checkInTokenHash) {
      return res.status(401).json({ message: "Invalid check-in token" });
    }

    req.checkIn = {
      event,
      tokenHint: event.checkInTokenHint,
    };

    return next();
  } catch (error) {
    console.error("Check-in token verification failed", error);
    return res.status(500).json({ message: "Unable to verify check-in access" });
  }
}
