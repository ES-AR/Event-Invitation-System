import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

const { GMAIL_USER, GMAIL_PASS, EMAIL_FROM, FRONTEND_URL } = process.env;

const gmailConfigured = Boolean(GMAIL_USER && GMAIL_PASS);
const transporter = gmailConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    })
  : null;

const defaultOrigin = (FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const attendeeUploadsDir = path.join(process.cwd(), "server", "uploads", "attendees");

const formatEventWindow = (event) => {
  if (!event?.startDate) {
    return "Schedule will be shared soon.";
  }

  const tz = event.timezone || "UTC";
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const baseFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: tz,
  });

  if (!end) {
    return baseFormatter.format(start);
  }

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeStyle: "short",
      timeZone: tz,
    });
    return `${baseFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }

  return `${baseFormatter.format(start)} – ${baseFormatter.format(end)}`;
};

const buildEventLink = (event) => {
  if (!event?.publicSlug) {
    return defaultOrigin;
  }
  return `${defaultOrigin}/invite/${event.publicSlug}`;
};

const buildMapLink = (event) => {
  const hasCoordinates = typeof event?.locationLatitude === "number" && typeof event?.locationLongitude === "number";
  if (hasCoordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${event.locationLatitude},${event.locationLongitude}`;
  }

  const searchText = event?.venueAddress || event?.venueName || event?.location;
  if (!searchText) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;
};

const sanitizeFileToken = (value) => {
  if (!value) return "invite";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "invite";
};

const resolvePhotoPath = (photoUrl) => {
  if (!photoUrl) return null;
  const filename = path.basename(photoUrl);
  const candidate = path.join(attendeeUploadsDir, filename);
  return fs.existsSync(candidate) ? candidate : null;
};

const generateTicketPdf = (attendee, event) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A6", layout: "landscape", margin: 20 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width;
    const height = doc.page.height;
    const primary = event?.theme?.secondary || "#0f172a";
    const accent = event?.theme?.primary || "#2563eb";

    doc.rect(0, 0, width, height).fill(primary);
    doc.rect(12, 12, width - 24, height - 24).fill("#ffffff");

    doc
      .fillColor(primary)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(event?.title || "Event Invite", 32, 32, { width: width - 220 });

    doc
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#0f172a")
      .text(formatEventWindow(event), { width: width - 220 });

    doc
      .moveDown(0.2)
      .fontSize(10)
      .text(event?.venueName || event?.location || "Venue TBA", { width: width - 220 })
      .fillColor("#475569")
      .text(event?.venueAddress || "Full address shared privately.", { width: width - 220 })
      .moveDown(0.4);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(accent)
      .text(attendee.fullName, { width: width - 220 })
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#0f172a")
      .text(`Slot: ${(attendee.slotType || "main").toUpperCase()} • Tier: ${attendee.ticketTier || "Main"}`)
      .fillColor("#475569")
      .text(`Registration ID: ${attendee._id?.toString() || "N/A"}`);

    doc
      .moveDown(0.5)
      .fontSize(9)
      .fillColor("#475569")
      .text("Carry this pass alongside the photo ID used during registration.", {
        width: width - 220,
      });

    const photoSize = 140;
    const photoX = width - photoSize - 32;
    const photoY = 40;
    const photoPath = resolvePhotoPath(attendee.photoUrl);

    if (photoPath) {
      doc.save();
      doc.roundedRect(photoX, photoY, photoSize, photoSize, 12).clip();
      doc.image(photoPath, photoX, photoY, {
        fit: [photoSize, photoSize],
        align: "center",
        valign: "center",
      });
      doc.restore();
    } else {
      doc
        .roundedRect(photoX, photoY, photoSize, photoSize, 12)
        .stroke("#cbd5f5")
        .fontSize(10)
        .fillColor("#94a3b8")
        .text("Photo unavailable", photoX, photoY + photoSize / 2 - 6, {
          width: photoSize,
          align: "center",
        });
    }

    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(event?.badgeMessaging || "Security may request an ID that matches this pass.", 32, height - 60, {
        width: width - 220,
      });

    doc.end();
  });

export async function sendEventApprovalEmail(attendee, event) {
  if (!transporter) {
    console.warn("Gmail SMTP is not configured. Skipping email for", attendee.email);
    return { sent: false, reason: "Gmail SMTP not configured" };
  }

  try {
    const eventLink = buildEventLink(event);
    const mapLink = buildMapLink(event);
    const venueLine = event?.venueName || event?.location || "Venue details will follow.";
    const addressLine = event?.venueAddress || "Exact address shared closer to the date.";
    const contactLine = event?.contactEmail || event?.contactPhone
      ? `${event?.contactEmail || ""}${event?.contactEmail && event?.contactPhone ? " • " : ""}${event?.contactPhone || ""}`
      : "";
    let ticketAttachment = null;

    try {
      const ticketBuffer = await generateTicketPdf(attendee, event);
      ticketAttachment = {
        filename: `${sanitizeFileToken(event?.publicSlug || event?.title || "event")}-${sanitizeFileToken(
          attendee.fullName || attendee.email || attendee._id
        )}-pass.pdf`,
        content: ticketBuffer,
      };
    } catch (ticketError) {
      console.error("Failed to generate ticket PDF:", ticketError.message);
    }

    const mailOptions = {
      from: EMAIL_FROM || `${event?.title || "Event"} <${GMAIL_USER}>`,
      to: attendee.email,
      subject: `You're confirmed for ${event?.title || "the event"}`,
      html: `
        <p>Hi ${attendee.fullName},</p>
        <p>Your RSVP has been approved. Bring a valid ID that matches the photo you submitted.</p>
        <p>Your personalized invite pass is attached as a PDF. Save it to your phone or print it for faster gate entry.</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0" />
        <p><strong>Event:</strong> ${event?.title || "Private Event"}</p>
        <p><strong>When:</strong> ${formatEventWindow(event)}</p>
        <p><strong>Where:</strong> ${venueLine}</p>
        <p><strong>Address:</strong> ${addressLine}</p>
        ${mapLink ? `<p><strong>Map location:</strong> <a href="${mapLink}">Open in Google Maps</a></p>` : ""}
        <p><strong>Invite link:</strong> <a href="${eventLink}">${eventLink}</a></p>
        ${contactLine ? `<p><strong>Host contact:</strong> ${contactLine}</p>` : ""}
        <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0" />
        <p>We look forward to welcoming you.</p>
      `,
    };

    if (ticketAttachment) {
      mailOptions.attachments = [ticketAttachment];
    }

    await transporter.sendMail(mailOptions);

    return { sent: true };
  } catch (error) {
    console.error("Failed to send approval email:", error.message);
    return { sent: false, reason: error.message };
  }
}
