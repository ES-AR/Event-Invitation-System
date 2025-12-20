import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-admin-secret";

async function authenticateWithBearer(req) {
	const authHeader = req.headers.authorization || "";
	if (!authHeader.startsWith("Bearer ")) {
		return null;
	}

	const token = authHeader.replace("Bearer ", "").trim();
	if (!token) return null;

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		const admin = await Admin.findById(payload.sub).lean();
		return admin || null;
	} catch (err) {
		return null;
	}
}

export default async function requireAdmin(req, res, next) {
	const adminFromToken = await authenticateWithBearer(req);
	if (!adminFromToken) {
		return res.status(401).json({ message: "Authentication required" });
	}

	req.admin = adminFromToken;
	return next();
}
