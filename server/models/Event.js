import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Quota-Controlled Event" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },

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
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
