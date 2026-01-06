import fs from "fs";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { normalizeSlug, requireOrganizerEvent } from "../utils/eventSetup.js";
import { applyAutoClose } from "../utils/eventStatus.js";
import { sendEventApprovalEmail } from "../services/email.service.js";

const slotCountsForEvent = async (eventId) => {
  const activeFilter = { $nin: ["cancelled", "rejected"] };
  return Promise.all([
    Registration.countDocuments({
      event: eventId,
      slotType: "main",
      status: activeFilter,
    }),
    Registration.countDocuments({
      event: eventId,
      slotType: "overflow",
      status: activeFilter,
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

export const registerUser = async (req, res) => {
  let registrationCreated = false;
  const abort = (status, payload) => {
    cleanupUploadedFile(req.file);
    return res.status(status).json(payload);
  };

  try {
    const slug = req.body.slug ? normalizeSlug(req.body.slug) : null;
    if (!slug) {
      return abort(400, { message: "Missing event invite" });
    }

    const event = await Event.findOne({ publicSlug: slug });
    if (!event) {
      return abort(404, { message: "Event not found" });
    }

    await applyAutoClose(event);

    if (!event.publicInviteEnabled) {
      return abort(403, {
        message: "This event is not accepting public registrations",
      });
    }

    if (!event.isRegistrationOpen) {
      return abort(400, {
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
    } = req.body;

    if (!req.file) {
      return abort(400, { message: "Attendee photo is required" });
    }

    const safeFirst = firstName.trim();
    const safeLast = lastName.trim();
    const normalizedName = (fullName || `${safeFirst} ${safeLast}`.trim()).trim();

    if (!normalizedName || !email) {
      return abort(400, { message: "Full name and email are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const existing = await Registration.findOne({ event: event._id, email: normalizedEmail });

    if (existing) {
      return abort(409, {
        message: "You have already registered for this event",
        code: "DUPLICATE_REGISTRATION",
        registration: {
          fullName: existing.fullName,
          email: existing.email,
          slotType: existing.slotType,
          status: existing.status,
        },
      });
    }

    const [mainCount, overflowCount] = await slotCountsForEvent(event._id);
    const tierPreference = (ticketTier || "Main").toString().trim().toLowerCase();
    const wantsOverflow = tierPreference === "overflow";
    const overflowCapacity = event.maxOverflowSlots || 0;
    let slotType = wantsOverflow ? "overflow" : "main";

    if (wantsOverflow) {
      if (!overflowCapacity) {
        return abort(400, { message: "Overflow registration is not enabled for this event." });
      }
      if (mainCount < event.maxMainSlots) {
        return abort(400, {
          message: "Main quota still has space. Use the primary registration link.",
          code: "MAIN_AVAILABLE",
        });
      }
      if (overflowCount >= overflowCapacity) {
        return abort(400, { message: "Overflow slots are currently full" });
      }
      slotType = "overflow";
    } else if (mainCount >= event.maxMainSlots) {
      return abort(400, {
        message: "Main quota is full. Request the overflow link from your host.",
        code: "MAIN_FULL",
      });
    }

    const status = event.requiresApproval ? "pending" : "approved";
    const isApproved = status === "approved";
    const photoUrl = `/uploads/attendees/${req.file.filename}`;

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
      photoUrl,
      statusHistory: [
        {
          status,
          note: "Registration created",
          changedAt: new Date(),
        },
      ],
    });
    registrationCreated = true;

    if (isApproved) {
      const emailResult = await sendEventApprovalEmail(registration, event);
      if (!emailResult.sent) {
        console.warn("Approval email failed for", registration.email, emailResult.reason);
      }
    }

    const message =
      status === "approved"
        ? "Registration confirmed — event details are on the way to your inbox."
        : "Registration received. Await approval email.";

    res.status(201).json({ message, registration });
  } catch (err) {
    if (!registrationCreated) {
      cleanupUploadedFile(req.file);
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listAttendees = async (req, res) => {
  try {
    const { eventId } = req.query;
    const event = await requireOrganizerEvent(req.admin._id, eventId);
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
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

export const getSingleAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id).populate("event", "organizer");

    if (!attendee || !attendee.event || String(attendee.event.organizer) !== String(req.admin._id)) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    res.json({ attendee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id).populate("event");

    if (!attendee || !attendee.event || String(attendee.event.organizer) !== String(req.admin._id)) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    attendee.status = "approved";
    attendee.isApproved = true;
    pushStatusHistory(attendee, "approved", "Approved manually");
    await attendee.save();

    const emailResult = attendee.event
      ? await sendEventApprovalEmail(attendee, attendee.event)
      : { sent: false, reason: "Event missing" };

    res.json({
      message: "Attendee approved",
      attendee,
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? null : emailResult.reason,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAttendee = async (req, res) => {
  try {
    const attendee = await Registration.findById(req.params.id).populate("event", "organizer");

    if (!attendee || !attendee.event || String(attendee.event.organizer) !== String(req.admin._id)) {
      return res.status(404).json({ message: "Attendee not found" });
    }

    await attendee.deleteOne();

    res.json({ message: "Attendee removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const bulkApproveAttendees = async (req, res) => {
  try {
    const { ids = [], eventId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide attendee ids" });
    }

    const event = await requireOrganizerEvent(req.admin._id, eventId);
    const attendees = await Registration.find({
      _id: { $in: ids },
      event: event._id,
    });

    const results = [];

    for (const attendee of attendees) {
      attendee.status = "approved";
      attendee.isApproved = true;
      pushStatusHistory(attendee, "approved", "Bulk approval");
      await attendee.save();

      let emailSent = false;
      let emailError = null;

      const emailResult = await sendEventApprovalEmail(attendee, event);
      emailSent = emailResult.sent;
      emailError = emailResult.sent ? null : emailResult.reason;

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
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

export const bulkDeleteAttendees = async (req, res) => {
  try {
    const { ids = [], eventId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide attendee ids" });
    }

    const event = await requireOrganizerEvent(req.admin._id, eventId);
    const result = await Registration.deleteMany({
      _id: { $in: ids },
      event: event._id,
    });

    res.json({
      message: `Removed ${result.deletedCount} attendee(s)`,
      deleted: result.deletedCount,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

const buildExportFilter = async (req) => {
  const event = await requireOrganizerEvent(req.admin._id, req.query.eventId);
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
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
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
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};
