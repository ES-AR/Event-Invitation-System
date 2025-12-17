import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const DEFAULT_EMAIL = process.env.SEED_ADMIN_EMAIL || "organizer@example.com";
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "organizer123";
const DEFAULT_NAME = process.env.SEED_ADMIN_NAME || "Event Organizer";

export async function seedDefaultAdmin() {
  const existing = await Admin.findOne({ email: DEFAULT_EMAIL });
  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const admin = await Admin.create({
    email: DEFAULT_EMAIL,
    passwordHash,
    displayName: DEFAULT_NAME,
  });

  console.log(
    `Seeded default organizer account (email: ${DEFAULT_EMAIL}, password: ${DEFAULT_PASSWORD})`
  );

  return admin;
}
