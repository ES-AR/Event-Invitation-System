const HEADER_NAME = "x-admin-key";

export default function requireAdmin(req, res, next) {
	const configuredKey = process.env.ADMIN_KEY;

	// If no admin key is configured, allow all requests (useful for local dev)
	if (!configuredKey) {
		return next();
	}

	const supplied = req.headers[HEADER_NAME] || req.headers[HEADER_NAME.toUpperCase()];

	if (supplied !== configuredKey) {
		return res.status(401).json({ message: "Admin key missing or invalid" });
	}

	return next();
}
