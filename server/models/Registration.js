import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    organization: { type: String, default: "" },
    note: { type: String, default: "" },

    slotType: {
      type: String,
      enum: ["main", "overflow"],
      default: "main",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "checked-in", "cancelled"],
      default: "pending",
    },

    isApproved: { type: Boolean, default: false },
    checkedIn: { type: Boolean, default: false },
    checkInToken: { type: String, default: null },
    checkInPhoto: { type: String, default: null },
    checkInTime: { type: Date, default: null },
  },
  { timestamps: true }
);

registrationSchema.index({ email: 1, event: 1 }, { unique: true });

export default mongoose.model("Registration", registrationSchema);
