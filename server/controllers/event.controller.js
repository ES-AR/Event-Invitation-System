import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import {
  ensureEventDocument,
  normalizeSlug,
  DEFAULT_EVENT_SLUG,
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

export const getEventSettings = async (req, res) => {
  try {
    const event = await applyAutoClose(await ensureEventDocument());
    res.status(200).json({ event });
  } catch (error) {
    console.error("Error fetching event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateEventSettings = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    const updates = {};

    if ("publicSlug" in req.body) {
      const desiredSlug = normalizeSlug(req.body.publicSlug);

      const existing = await Event.findOne({
        publicSlug: desiredSlug,
        _id: { $ne: event._id },
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "This invite link is already in use" });
      }

      updates.publicSlug = desiredSlug;
    }

    editableFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(event, updates);
    await event.save();

    res.status(200).json({
      message: "Event settings updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const closeRegistration = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    event.isRegistrationOpen = false;
    event.closeReason = req.body?.reason || "Closed by admin";
    await event.save();

    res.status(200).json({
      message: "Registration has been closed",
      event,
    });
  } catch (error) {
    console.error("Error closing registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const openRegistration = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    event.isRegistrationOpen = true;
    event.closeReason = "";
    await event.save();

    res.status(200).json({
      message: "Registration has been opened",
      event,
    });
  } catch (error) {
    console.error("Error opening registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getEventStats = async (req, res) => {
  try {
    const event = await applyAutoClose(await ensureEventDocument());

    const [pending, approved, checkedIn, cancelled, mainCount, overflowCount] =
      await Promise.all([
        Registration.countDocuments({ event: event._id, status: "pending" }),
        Registration.countDocuments({ event: event._id, status: "approved" }),
        Registration.countDocuments({ event: event._id, status: "checked-in" }),
        Registration.countDocuments({ event: event._id, status: "cancelled" }),
        Registration.countDocuments({ event: event._id, slotType: "main" }),
        Registration.countDocuments({ event: event._id, slotType: "overflow" }),
      ]);

    res.status(200).json({
      event,
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
    console.error("Error loading event stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPublicEvent = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug || DEFAULT_EVENT_SLUG);

    let event = await Event.findOne({ publicSlug: slug });

    if (!event) {
      if (slug === DEFAULT_EVENT_SLUG) {
        event = await ensureEventDocument();
      } else {
        return res.status(404).json({ message: "Event not found" });
      }
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
      event: {
        title: event.title,
        description: event.description,
        location: event.location,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        bannerUrl: event.bannerUrl,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        maxMainSlots: event.maxMainSlots,
        maxOverflowSlots: event.maxOverflowSlots,
        isRegistrationOpen: event.isRegistrationOpen,
        closeReason: event.closeReason,
        allowWalkIns: event.allowWalkIns,
        registrationClosesAt: event.registrationClosesAt,
        autoCloseOnExpire: event.autoCloseOnExpire,
        publicSlug: event.publicSlug,
        badgeMessaging: event.badgeMessaging,
        contactEmail: event.contactEmail,
        contactPhone: event.contactPhone,
        supportLink: event.supportLink,
        theme: event.theme,
        ticketTiers: event.ticketTiers,
        quota,
      },
    });
  } catch (error) {
    console.error("Error fetching public event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
