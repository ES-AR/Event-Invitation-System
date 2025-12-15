import { v4 as uuidv4 } from "uuid";
import Registration from "../models/Registration.js";
import { ensureEventDocument } from "../utils/eventSetup.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

const buildCheckInLink = (token) => `${FRONTEND_ORIGIN}/check-in?token=${token}`;

const slotCountsForEvent = async (eventId) => {
  return Promise.all([
    Registration.countDocuments({
      event: eventId,
      slotType: "main",
      status: { $ne: "cancelled" },
    }),
    Registration.countDocuments({
      event: eventId,
      slotType: "overflow",
      status: { $ne: "cancelled" },
    }),
  ]);
};

export const registerUser = async (req, res) => {
  try {
    const event = await ensureEventDocument();

    if (!event.isRegistrationOpen) {
      return res.status(400).json({
        message: event.closeReason || "Registration is currently closed",
      });
    }

    const { fullName, email, phone = "", organization = "", note = "" } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const existing = await Registration.findOne({ event: event._id, email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ message: "You have already registered for this event" });
    }

    const [mainCount, overflowCount] = await slotCountsForEvent(event._id);
    let slotType = "main";

    if (mainCount >= event.maxMainSlots) {
      if (event.maxOverflowSlots === 0 || overflowCount >= event.maxOverflowSlots) {
        return res.status(400).json({ message: "All slots are currently full" });
      }
      slotType = "overflow";
    }

    const status = event.requiresApproval ? "pending" : "approved";
    const isApproved = status === "approved";
    const checkInToken = isApproved ? uuidv4() : null;

    const registration = await Registration.create({
      event: event._id,
      fullName: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      organization,
      note,
      slotType,
      status,
      isApproved,
      checkInToken,
    });

    const message =
      status === "approved"
        ? "Registration confirmed — you have a spot!"
        : "Registration received. Await approval email.";

    res.status(201).json({ message, registration });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listAttendees = async (req, res) => {
  try {
    const event = await ensureEventDocument();
    const filter = { event: event._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const attendees = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ attendees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSingleAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    res.json({ attendee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    attendee.status = "approved";
    attendee.isApproved = true;
    attendee.checkInToken = attendee.checkInToken || uuidv4();
    await attendee.save();

    res.json({
      message: "Attendee approved",
      attendee,
      checkInUrl: buildCheckInLink(attendee.checkInToken),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAttendee = async (req, res) => {
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    res.json({ message: "Attendee removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendCheckInLink = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id);

    if (!attendee) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    if (!attendee.isApproved) {
      return res.status(400).json({ message: "Approve attendee before sending link" });
    }

    attendee.checkInToken = attendee.checkInToken || uuidv4();
    await attendee.save();

    res.json({
      message: "Check-in link generated",
      checkInUrl: buildCheckInLink(attendee.checkInToken),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkInAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findOne({ checkInToken: req.params.token });

    if (!attendee) {
      return res.status(404).json({ message: "Invalid or expired check-in link" });
    }

    if (attendee.checkedIn) {
      return res.status(400).json({ message: "Attendee already checked in" });
    }

    const { fullName, email, phone, photoUrl } = req.body;
    const normalizedFullName = (fullName || "").trim().toLowerCase();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPhone = (phone || "").trim();

    const matches =
      (attendee.fullName.trim().toLowerCase() === normalizedFullName ? 1 : 0) +
      (attendee.email === normalizedEmail ? 1 : 0) +
      (attendee.phone === normalizedPhone ? 1 : 0);

    if (matches < 2) {
      return res.status(400).json({
        message: "Identity verification failed. Details do not match.",
      });
    }

    attendee.checkedIn = true;
    attendee.status = "checked-in";
    attendee.checkInPhoto = photoUrl || attendee.checkInPhoto;
    attendee.checkInTime = new Date();

    await attendee.save();

    res.json({
      message: "Check-in successful",
      attendee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
