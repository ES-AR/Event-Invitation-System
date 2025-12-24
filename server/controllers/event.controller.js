import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import {
  DEFAULT_EVENT_SLUG,
  generateUniqueSlug,
  normalizeSlug,
  requireOrganizerEvent,
} from "../utils/eventSetup.js";
import { applyAutoClose } from "../utils/eventStatus.js";

const editableFields = [
  "title",
  "description",
  "location",
  "venueName",
  "venueAddress",
  "startDate",
  "endDate",
  "timezone",
  "bannerUrl",
  "publicInviteEnabled",
  "registrationClosesAt",
  "autoCloseOnExpire",
  "maxMainSlots",
  "maxOverflowSlots",
  "requiresApproval",
  "allowWalkIns",
  "checkInInstructions",
  "badgeMessaging",
  "contactEmail",
  "contactPhone",
  "supportLink",
  "isRegistrationOpen",
  "closeReason",
  "theme",
  "ticketTiers",
];

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const serializeEvent = (event, { includeShareUrl = true, quota } = {}) => {
  const serialized = {
    id: event._id?.toString?.(),
    title: event.title,
    description: event.description,
    location: event.location,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    startDate: event.startDate,
    endDate: event.endDate,
    timezone: event.timezone,
    bannerUrl: event.bannerUrl,
    publicSlug: event.publicSlug,
    publicInviteEnabled: event.publicInviteEnabled,
    registrationClosesAt: event.registrationClosesAt,
    autoCloseOnExpire: event.autoCloseOnExpire,
    maxMainSlots: event.maxMainSlots,
    maxOverflowSlots: event.maxOverflowSlots,
    isRegistrationOpen: event.isRegistrationOpen,
    closeReason: event.closeReason,
    requiresApproval: event.requiresApproval,
    allowWalkIns: event.allowWalkIns,
    checkInInstructions: event.checkInInstructions,
    badgeMessaging: event.badgeMessaging,
    contactEmail: event.contactEmail,
    contactPhone: event.contactPhone,
    supportLink: event.supportLink,
    theme: event.theme,
    ticketTiers: event.ticketTiers,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };

  if (includeShareUrl) {
    serialized.shareUrl = `${FRONTEND_ORIGIN}/invite/${event.publicSlug}`;
  }

  if (quota) {
    serialized.quota = quota;
  }

  return serialized;
};

const applyEditableFields = (event, source = {}) => {
  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      event[field] = source[field];
    }
  });
};

export const listOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.admin._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ events: events.map((event) => serializeEvent(event)) });
  } catch (error) {
    console.error("Error listing events", error);
    res.status(500).json({ message: "Unable to load events", error: error.message });
  }
};

export const checkSlugAvailability = async (req, res) => {
  try {
    const desiredSlug = req.query.slug || req.body?.slug || DEFAULT_EVENT_SLUG;
    const eventId = req.query.eventId || req.body?.eventId;
    const normalized = normalizeSlug(desiredSlug);
    const filter = eventId ? { _id: { $ne: eventId } } : {};
    const exists = await Event.exists({ publicSlug: normalized, ...filter });

    if (!exists) {
      return res.json({ available: true, slug: normalized });
    }

    const uniqueSuggestion = await generateUniqueSlug(normalized, eventId, {
      forcePrefixedSuggestion: true,
    });

    return res.json({ available: false, slug: uniqueSuggestion });
  } catch (error) {
    console.error("Error checking slug availability", error);
    res.status(500).json({ message: "Unable to verify slug", error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const baseSlugSource = req.body?.publicSlug || req.body?.title || DEFAULT_EVENT_SLUG;
    const publicSlug = await generateUniqueSlug(baseSlugSource);
    const payload = {
      organizer: req.admin._id,
      publicSlug,
      isRegistrationOpen: true,
      closeReason: "",
    };

    applyEditableFields(payload, req.body);

    if (!payload.title) {
      payload.title = "Untitled Event";
    }

    const event = await Event.create(payload);
    res.status(201).json({ message: "Event created", event: serializeEvent(event) });
  } catch (error) {
    console.error("Error creating event", error);
    res.status(500).json({ message: "Unable to create event", error: error.message });
  }
};

export const getEventSettings = async (req, res) => {
  try {
    const event = await applyAutoClose(await requireOrganizerEvent(req.admin._id, req.params.eventId));
    res.json({ event: serializeEvent(event) });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateEventSettings = async (req, res) => {
  try {
    const event = await requireOrganizerEvent(req.admin._id, req.params.eventId);

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "publicSlug")) {
      const desired = req.body.publicSlug || event.title || DEFAULT_EVENT_SLUG;
      event.publicSlug = await generateUniqueSlug(desired, event._id);
    }

    applyEditableFields(event, req.body);
    await event.save();

    res.json({ message: "Event settings updated successfully", event: serializeEvent(event) });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error updating event settings", error);
    res.status(status).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await requireOrganizerEvent(req.admin._id, req.params.eventId);
    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error deleting event", error);
    res.status(status).json({ message: error.message });
  }
};

export const closeRegistration = async (req, res) => {
  try {
    const event = await requireOrganizerEvent(req.admin._id, req.params.eventId);
    event.isRegistrationOpen = false;
    event.closeReason = req.body?.reason || "Closed by organizer";
    await event.save();
    res.json({ message: "Registration closed", event: serializeEvent(event) });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

export const openRegistration = async (req, res) => {
  try {
    const event = await requireOrganizerEvent(req.admin._id, req.params.eventId);
    event.isRegistrationOpen = true;
    event.closeReason = "";
    await event.save();
    res.json({ message: "Registration opened", event: serializeEvent(event) });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

export const getEventStats = async (req, res) => {
  try {
    const event = await applyAutoClose(await requireOrganizerEvent(req.admin._id, req.params.eventId));

    const [pending, approved, checkedIn, cancelled, mainCount, overflowCount] = await Promise.all([
      Registration.countDocuments({ event: event._id, status: "pending" }),
      Registration.countDocuments({ event: event._id, status: "approved" }),
      Registration.countDocuments({ event: event._id, status: "checked-in" }),
      Registration.countDocuments({ event: event._id, status: "cancelled" }),
      Registration.countDocuments({ event: event._id, slotType: "main" }),
      Registration.countDocuments({ event: event._id, slotType: "overflow" }),
    ]);

    res.json({
      event: serializeEvent(event),
      totals: {
        pending,
        approved,
        checkedIn,
        cancelled,
      },
      slots: {
        main: {
          used: mainCount,
          capacity: event.maxMainSlots,
        },
        overflow: {
          used: overflowCount,
          capacity: event.maxOverflowSlots,
        },
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error loading event stats", error);
    res.status(status).json({ message: error.message });
  }
};

export const getPublicEvent = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug || DEFAULT_EVENT_SLUG);
    const event = await Event.findOne({ publicSlug: slug });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await applyAutoClose(event);

    if (!event.publicInviteEnabled) {
      return res.status(403).json({ message: "This event is not accepting public registrations" });
    }

    const activeFilter = { status: { $ne: "cancelled" } };
    const [mainUsed, overflowUsed] = await Promise.all([
      Registration.countDocuments({ event: event._id, slotType: "main", ...activeFilter }),
      Registration.countDocuments({ event: event._id, slotType: "overflow", ...activeFilter }),
    ]);

    const quota = {
      main: {
        capacity: event.maxMainSlots,
        used: mainUsed,
        remaining: Math.max(event.maxMainSlots - mainUsed, 0),
      },
      overflow: {
        capacity: event.maxOverflowSlots,
        used: overflowUsed,
        remaining: Math.max(event.maxOverflowSlots - overflowUsed, 0),
      },
    };

    res.json({
      event: serializeEvent(event, { includeShareUrl: false, quota }),
    });
  } catch (error) {
    console.error("Error fetching public event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
