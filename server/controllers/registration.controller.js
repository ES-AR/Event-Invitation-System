import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { ensureEventDocument, normalizeSlug } from "../utils/eventSetup.js";
import { applyAutoClose } from "../utils/eventStatus.js";
import { sendCheckInEmail } from "../services/email.service.js";
import {
  createCaptchaChallenge,
  verifyCaptchaResponse,
} from "../utils/captcha.js";

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

const cleanupUploadedFile = (file) => {
  if (file?.path) {
    fs.promises.unlink(file.path).catch(() => {});
  }
};

const pushStatusHistory = (attendee, status, note = "") => {
  if (!attendee.statusHistory) {
    attendee.statusHistory = [];
  }
  attendee.statusHistory.push({ status, note, changedAt: new Date() });
};

export const getCaptchaChallenge = (req, res) => {
  const challenge = createCaptchaChallenge();
  res.json(challenge);
};

export const registerUser = async (req, res) => {
  try {
    const slug = req.body.slug ? normalizeSlug(req.body.slug) : null;
    let event;

    if (slug) {
      event = await Event.findOne({ publicSlug: slug });
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
    } else {
      event = await ensureEventDocument();
    }

    await applyAutoClose(event);

    if (!event.publicInviteEnabled) {
      return res.status(403).json({
        message: "This event is not accepting public registrations",
      });
    }

    if (!event.isRegistrationOpen) {
      return res.status(400).json({
        message: event.closeReason || "Registration is currently closed",
      });
    }

    const {
      fullName,
      firstName = "",
      lastName = "",
      email,
      phone = "",
      organization = "",
      jobTitle = "",
      dietaryRestrictions = "None",
      ticketTier = "Main",
      note = "",
      captchaToken,
      captchaAnswer,
    } = req.body;

    if (!verifyCaptchaResponse(captchaToken, captchaAnswer)) {
      return res.status(400).json({
        message: "Captcha verification failed",
        code: "CAPTCHA_INVALID",
      });
    }

    const safeFirst = firstName.trim();
    const safeLast = lastName.trim();
    const normalizedName = (fullName || `${safeFirst} ${safeLast}`.trim()).trim();

    if (!normalizedName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const existing = await Registration.findOne({ event: event._id, email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        message: "You have already registered for this event",
        code: "DUPLICATE_REGISTRATION",
        registration: {
          fullName: existing.fullName,
          email: existing.email,
          slotType: existing.slotType,
          status: existing.status,
          checkedIn: existing.checkedIn,
          checkInToken: existing.checkInToken,
        },
      });
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
      firstName: safeFirst,
      lastName: safeLast,
      fullName: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      organization,
      jobTitle,
      note,
      dietaryRestrictions,
      ticketTier,
      slotType,
      status,
      isApproved,
      checkInToken,
      statusHistory: [
        {
          status,
          note: "Registration created",
          changedAt: new Date(),
        },
      ],
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

    if (req.query.slotType) {
      filter.slotType = req.query.slotType;
    }

    const searchTerm = (req.query.q || "").trim();
    if (searchTerm) {
      filter.$or = [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { organization: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "createdAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;

    const [attendees, total] = await Promise.all([
      Registration.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    res.json({
      attendees,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sortBy,
        sortDir: sortDir === 1 ? "asc" : "desc",
      },
    });
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
    pushStatusHistory(attendee, "approved", "Approved manually");
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

    const checkInUrl = buildCheckInLink(attendee.checkInToken);
    const emailResult = await sendCheckInEmail(attendee, checkInUrl);

    res.json({
      message: emailResult.sent
        ? "Check-in link emailed to attendee"
        : "Check-in link generated",
      checkInUrl,
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? null : emailResult.reason,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCheckInDetails = async (req, res) => {
  try {
    const attendee = await Registration.findOne({
      checkInToken: req.params.token,
    }).populate("event");

    if (!attendee) {
      cleanupUploadedFile(req.file);
      return res.status(404).json({ message: "Invalid or expired check-in link" });
    }

    res.json({
      attendee: {
        fullName: attendee.fullName,
        email: attendee.email,
        phone: attendee.phone,
        slotType: attendee.slotType,
        status: attendee.status,
        checkedIn: attendee.checkedIn,
        checkInTime: attendee.checkInTime,
      },
      event: attendee.event
        ? {
            title: attendee.event.title,
            location: attendee.event.location,
            startDate: attendee.event.startDate,
            badgeMessaging: attendee.event.badgeMessaging,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkInAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findOne({
      checkInToken: req.params.token,
    }).populate("event");

    if (!attendee) {
      return res.status(404).json({ message: "Invalid or expired check-in link" });
    }

    if (attendee.checkedIn) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({ message: "Attendee already checked in" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo upload is required" });
    }

    const { fullName, email, phone } = req.body;
    const normalizedFullName = (fullName || "").trim().toLowerCase();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPhone = (phone || "").trim();

    const matches =
      (attendee.fullName.trim().toLowerCase() === normalizedFullName ? 1 : 0) +
      (attendee.email === normalizedEmail ? 1 : 0) +
      (attendee.phone === normalizedPhone ? 1 : 0);

    if (matches < 2) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        message: "Identity verification failed. Details do not match.",
      });
    }

    attendee.checkedIn = true;
    attendee.status = "checked-in";
    attendee.checkInPhoto = `/uploads/checkins/${req.file.filename}`;
    attendee.checkInTime = new Date();
    pushStatusHistory(attendee, "checked-in", "Self check-in completed");

    await attendee.save();

    res.json({
      message: "Check-in successful",
      attendee: {
        fullName: attendee.fullName,
        slotType: attendee.slotType,
        status: attendee.status,
        checkInTime: attendee.checkInTime,
        checkInPhoto: attendee.checkInPhoto,
      },
      event: attendee.event
        ? {
            title: attendee.event.title,
            startDate: attendee.event.startDate,
          }
        : null,
    });
  } catch (err) {
    cleanupUploadedFile(req.file);
    res.status(500).json({ message: err.message });
  }
};

export const bulkApproveAttendees = async (req, res) => {
  try {
    const { ids = [], sendEmails = false } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide attendee ids" });
    }

    const event = await ensureEventDocument();
    const attendees = await Registration.find({
      _id: { $in: ids },
      event: event._id,
    });

    const results = [];

    for (const attendee of attendees) {
      attendee.status = "approved";
      attendee.isApproved = true;
      attendee.checkInToken = attendee.checkInToken || uuidv4();
      pushStatusHistory(attendee, "approved", "Bulk approval");
      await attendee.save();

      let emailSent = false;
      let emailError = null;

      if (sendEmails) {
        const checkInUrl = buildCheckInLink(attendee.checkInToken);
        const emailResult = await sendCheckInEmail(attendee, checkInUrl);
        emailSent = emailResult.sent;
        emailError = emailResult.sent ? null : emailResult.reason;
      }

      results.push({
        id: attendee._id,
        emailSent,
        emailError,
      });
    }

    res.json({
      message: `Approved ${attendees.length} attendee(s)`,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkDeleteAttendees = async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide attendee ids" });
    }

    const event = await ensureEventDocument();
    const result = await Registration.deleteMany({
      _id: { $in: ids },
      event: event._id,
    });

    res.json({
      message: `Removed ${result.deletedCount} attendee(s)`,
      deleted: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const buildExportFilter = async (req) => {
  const event = await ensureEventDocument();
  const filter = { event: event._id };
  if (req.query.status) {
    filter.status = req.query.status;
  }
  return { event, filter };
};

export const exportAttendeesCsv = async (req, res) => {
  try {
    const { filter } = await buildExportFilter(req);
    const attendees = await Registration.find(filter).lean();

    const fields = [
      { label: "Full Name", value: "fullName" },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Slot", value: "slotType" },
      { label: "Status", value: "status" },
      { label: "Organization", value: "organization" },
      { label: "Registered", value: (row) => row.createdAt },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(attendees);

    res.header("Content-Type", "text/csv");
    res.header(
      "Content-Disposition",
      "attachment; filename=attendees.csv"
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportAttendeesPdf = async (req, res) => {
  try {
    const { event, filter } = await buildExportFilter(req);
    const attendees = await Registration.find(filter).lean();

    const doc = new PDFDocument({ margin: 40 });
    res.header("Content-Type", "application/pdf");
    res.header(
      "Content-Disposition",
      "attachment; filename=attendees.pdf"
    );
    doc.pipe(res);

    doc.fontSize(16).text(`${event.title} — Attendees`, { align: "center" });
    doc.moveDown();

    attendees.forEach((attendee) => {
      doc
        .fontSize(11)
        .text(`${attendee.fullName} (${attendee.email})`)
        .text(
          `Slot: ${attendee.slotType} | Status: ${attendee.status} | Org: ${attendee.organization || "-"}`
        )
        .moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
