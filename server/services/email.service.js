import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
} = process.env;

const smtpConfigured = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;

let transporter;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendCheckInEmail(attendee, checkInUrl) {
  if (!smtpConfigured) {
    console.warn(
      "SMTP settings missing. Skipping email send for",
      attendee.email
    );
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || `Event Organizer <${SMTP_USER}>`,
      to: attendee.email,
      subject: `Your check-in link for ${attendee.fullName}`,
      html: `
        <p>Hello ${attendee.fullName},</p>
        <p>Your check-in link is ready. Please open it on your phone when you arrive:</p>
        <p><a href="${checkInUrl}">${checkInUrl}</a></p>
        <p>Thank you!</p>
      `,
    });

    return { sent: true };
  } catch (error) {
    console.error("Failed to send check-in email:", error.message);
    return { sent: false, reason: error.message };
  }
}
