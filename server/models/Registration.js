import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    organization: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    note: { type: String, default: "" },
    dietaryRestrictions: { type: String, default: "None" },
    ticketTier: { type: String, default: "Main" },
    photoUrl: { type: String, required: true },
    ticketCode: { type: String, trim: true, default: "" },

    isCheckedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: String, default: "" },

    slotType: {
      type: String,
      enum: ["main", "overflow"],
      default: "main",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    isApproved: { type: Boolean, default: false },
    statusHistory: {
      type: [
        new mongoose.Schema(
          {
            status: String,
            changedAt: { type: Date, default: Date.now },
            note: String,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

registrationSchema.index({ email: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, ticketCode: 1 });
registrationSchema.index({ event: 1, isCheckedIn: 1 });

export default mongoose.model("Registration", registrationSchema);
