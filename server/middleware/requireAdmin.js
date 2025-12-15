const HEADER_CANDIDATES = ["x-admin-key", "admin-key"];

export default function requireAdmin(req, res, next) {
	const configuredKey = process.env.ADMIN_KEY;

	// If no admin key is configured, allow all requests (useful for local dev)
	if (!configuredKey) {
		return next();
	}

	const supplied = HEADER_CANDIDATES
		.map((name) => req.headers[name] || req.headers[name.toUpperCase()])
		.find(Boolean);

	if (supplied !== configuredKey) {
		return res.status(401).json({ message: "Admin key missing or invalid" });
	}

	return next();
}
