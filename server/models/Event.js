// Event.js
import mongoose from "mongoose";
const eventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    title: { type: String, default: "Quota-Controlled Event" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    locationLatitude: { type: Number},
    locationLongitude: { type: Number},
    venueName: { type: String, default: "" },
    venueAddress: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    timezone: { type: String, default: "America/New_York" },
    bannerUrl: { type: String, default: "" },

    publicSlug: { type: String, default: "main-event", unique: true },
    publicInviteEnabled: { type: Boolean, default: true },

    registrationClosesAt: { type: Date, default: null },
    autoCloseOnExpire: { type: Boolean, default: false },

    // Registration limits
    maxMainSlots: { type: Number, default: 100 },
    maxOverflowSlots: { type: Number, default: 0 },

    // Registration open/close
    isRegistrationOpen: { type: Boolean, default: true },
    closeReason: { type: String, default: "" },

    // Admin workflow controls
    requiresApproval: { type: Boolean, default: true },
    allowWalkIns: { type: Boolean, default: false },
    checkInInstructions: { type: String, default: "" },
    badgeMessaging: { type: String, default: "Security check required" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    supportLink: { type: String, default: "" },
    checkInTokenHash: { type: String, default: "" },
    checkInTokenHint: { type: String, default: "" },
    checkInTokenIssuedAt: { type: Date, default: null },
    theme: {
      primary: { type: String, default: "#2563eb" },
      secondary: { type: String, default: "#0f172a" },
      gradientStart: { type: String, default: "#2563eb" },
      gradientEnd: { type: String, default: "#1d4ed8" },
    },
    ticketTiers: {
      type: [
        new mongoose.Schema(
          {
            name: String,
            capacity: Number,
            perks: [String],
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ publicSlug: 1 }, { unique: true });

export default mongoose.model("Event", eventSchema);
