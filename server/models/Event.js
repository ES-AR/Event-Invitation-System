import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    // Registration limits
    totalQuota: { type: Number, required: true },
    usedQuota: { type: Number, default: 0 },

    // Registration open/close
    isRegistrationOpen: { type: Boolean, default: true },

    // Optional: allow/disallow walk‑ins
    allowCheckInWithoutRegistration: { type: Boolean, default: false },

    // Banner image URL (optional)
    bannerUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
