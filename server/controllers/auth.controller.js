import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-admin-secret";
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES || "12h";

const serializeAdmin = (admin) => ({
  id: admin._id,
  email: admin.email,
  displayName: admin.displayName,
  role: admin.role,
  avatarColor: admin.avatarColor,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      token,
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    console.error("Error logging in admin", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCurrentAdmin = async (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ admin: serializeAdmin(req.admin) });
};

export const registerAdmin = async (req, res) => {
  try {
    const { accessKey, email, password, displayName } = req.body || {};

    if (!process.env.ADMIN_KEY) {
      return res.status(500).json({ message: "Admin registration is not configured" });
    }

    if (!accessKey || accessKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ message: "Invalid organizer access key" });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An organizer with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      email: normalizedEmail,
      passwordHash,
      displayName: (displayName || "").trim() || normalizedEmail.split("@")[0],
    });

    const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: "Organizer account created",
      token,
      admin: serializeAdmin(admin),
    });
  } catch (error) {
    console.error("Error registering admin", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
