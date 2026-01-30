import Registration from "../models/Registration.js";
import { normalizeSlug } from "../utils/eventSetup.js";
import { hashCheckInToken } from "../utils/helpers.js";

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeAttendee = (doc) => {
  const attendee = doc?.toObject ? doc.toObject() : doc;
  const fallbackCode = attendee._id ? `#ID-${attendee._id.toString().slice(-4).toUpperCase()}` : "";
  return {
    id: attendee._id?.toString?.() || attendee.id,
    fullName: attendee.fullName,
    email: attendee.email,
    phone: attendee.phone,
    organization: attendee.organization,
    jobTitle: attendee.jobTitle,
    ticketTier: attendee.ticketTier,
    slotType: attendee.slotType,
    status: attendee.status,
    isApproved: attendee.isApproved,
    isCheckedIn: attendee.isCheckedIn,
    checkedInAt: attendee.checkedInAt,
    checkedInBy: attendee.checkedInBy,
    ticketCode: attendee.ticketCode || fallbackCode,
    photoUrl: attendee.photoUrl,
    note: attendee.note,
    createdAt: attendee.createdAt,
  };
};

const buildSearchFilter = (eventId, rawQuery = "") => {
  const query = rawQuery.trim();
  if (!query) {
    return { event: eventId };
  }

  const escaped = escapeRegex(query);
  const regex = new RegExp(escaped, "i");
  const filters = [
    { fullName: { $regex: regex } },
    { email: { $regex: regex } },
    { organization: { $regex: regex } },
  ];

  if (/\d/.test(query)) {
    const digits = query.replace(/\D/g, "");
    if (digits) {
      filters.push({ phone: { $regex: digits.slice(-4), $options: "i" } });
    }
  }

  const ticketTerm = query.replace(/^#/, "");
  if (ticketTerm) {
    filters.push({ ticketCode: { $regex: new RegExp(escapeRegex(ticketTerm), "i") } });
  }

  return { event: eventId, $or: filters };
};

export const startCheckInSession = async (req, res) => {
  try {
    const tokenValue = req.body?.token || req.headers["x-checkin-token"] || "";
    if (!tokenValue) {
      return res.status(401).json({ message: "Provide a token to continue" });
    }

    const slug = normalizeSlug(req.params.slug || req.body.slug || req.query.slug);
    const event = req.checkIn?.event;

    if (!event || hashCheckInToken(tokenValue) !== event.checkInTokenHash) {
      return res.status(401).json({ message: "Invalid check-in token" });
    }

    const [approved, checkedIn, pending] = await Promise.all([
      Registration.countDocuments({ event: event._id, status: "approved" }),
      Registration.countDocuments({ event: event._id, isCheckedIn: true }),
      Registration.countDocuments({ event: event._id, status: "pending" }),
    ]);

    return res.json({
      event: {
        id: event._id.toString(),
        title: event.title,
        slug,
        venueName: event.venueName,
        location: event.location,
        checkInInstructions: event.checkInInstructions,
        allowWalkIns: event.allowWalkIns,
        startDate: event.startDate,
        endDate: event.endDate,
        link: `${FRONTEND_ORIGIN}/checkin/${event.publicSlug}`,
      },
      tokenHint: event.checkInTokenHint,
      stats: { approved, checkedIn, pending },
    });
  } catch (error) {
    console.error("Unable to start check-in session", error);
    res.status(500).json({ message: "Unable to start session" });
  }
};

export const searchAttendees = async (req, res) => {
  try {
    const { event } = req.checkIn;
    const query = req.query.q || "";
    if (!query.trim()) {
      return res.json({ attendees: [] });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 25);
    const filter = buildSearchFilter(event._id, query);
    const attendees = await Registration.find(filter)
      .sort({ isCheckedIn: 1, updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ attendees: attendees.map(serializeAttendee) });
  } catch (error) {
    console.error("Check-in search failed", error);
    res.status(500).json({ message: "Unable to search attendees" });
  }
};

export const getAttendee = async (req, res) => {
  try {
    const { event } = req.checkIn;
    const attendee = await Registration.findOne({ _id: req.params.attendeeId, event: event._id });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }
    res.json({ attendee: serializeAttendee(attendee) });
  } catch (error) {
    console.error("Failed to load attendee", error);
    res.status(500).json({ message: "Unable to load attendee" });
  }
};

export const markAttendeePresent = async (req, res) => {
  try {
    const { event, tokenHint } = req.checkIn;
    const attendee = await Registration.findOne({ _id: req.params.attendeeId, event: event._id });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    if (attendee.isCheckedIn) {
      return res.status(409).json({ message: "Attendee already checked in", attendee: serializeAttendee(attendee) });
    }

    if (["rejected", "cancelled"].includes(attendee.status)) {
      return res.status(400).json({ message: "This attendee is flagged and cannot be checked in" });
    }

    if (attendee.status !== "approved" && !event.allowWalkIns) {
      return res
        .status(403)
        .json({ message: "Only approved attendees can be checked in for this event" });
    }

    attendee.isCheckedIn = true;
    attendee.checkedInAt = new Date();
    attendee.checkedInBy = tokenHint ? `Token-${tokenHint}` : "Token";
    await attendee.save();

    res.json({
      message: "Attendee checked in",
      attendee: serializeAttendee(attendee),
    });
  } catch (error) {
    console.error("Check-in update failed", error);
    res.status(500).json({ message: "Unable to check in attendee" });
  }
};

export const undoCheckIn = async (req, res) => {
  try {
    const { event } = req.checkIn;
    const attendee = await Registration.findOne({ _id: req.params.attendeeId, event: event._id });
    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    if (!attendee.isCheckedIn) {
      return res.status(409).json({ message: "Attendee has not been checked in yet" });
    }

    attendee.isCheckedIn = false;
    attendee.checkedInAt = null;
    attendee.checkedInBy = "";
    await attendee.save();

    res.json({ message: "Check-in reverted", attendee: serializeAttendee(attendee) });
  } catch (error) {
    console.error("Undo check-in failed", error);
    res.status(500).json({ message: "Unable to revert check-in" });
  }
};
