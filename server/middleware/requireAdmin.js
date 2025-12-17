import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const HEADER_CANDIDATES = ["x-admin-key", "admin-key"];
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
	if (adminFromToken) {
		req.admin = adminFromToken;
		return next();
	}

	const configuredKey = process.env.ADMIN_KEY;
	if (!configuredKey) {
		return res.status(401).json({ message: "Authentication required" });
	}

	const supplied = HEADER_CANDIDATES
		.map((name) => req.headers[name] || req.headers[name.toUpperCase()])
		.find(Boolean);

	if (supplied !== configuredKey) {
		return res.status(401).json({ message: "Admin key missing or invalid" });
	}

	return next();
}
