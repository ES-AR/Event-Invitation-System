import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "Organizer" },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    avatarColor: { type: String, default: "#2563eb" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Admin", adminSchema);
