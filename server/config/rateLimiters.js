import rateLimit from "express-rate-limit";

const baseOptions = {
	standardHeaders: "draft-7",
	legacyHeaders: false,
};

export const registrationLimiter = rateLimit({
	...baseOptions,
	windowMs: 15 * 60 * 1000,
	limit: 8,
	message: {
		message: "Too many registration attempts. Please wait a few minutes and try again.",
		code: "RATE_LIMITED",
	},
});

