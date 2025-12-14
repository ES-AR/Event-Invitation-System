import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },

    // reference to event
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    // Status: registered, checked-in, cancelled
    status: {
      type: String,
      enum: ["registered", "checked-in", "cancelled"],
      default: "registered",
    },

    // Admin can approve registrations if needed
    isApproved: { type: Boolean, default: true },

    // For check-in timestamp
    checkInTime: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Registration", registrationSchema);
