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
