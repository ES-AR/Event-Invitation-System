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

export const checkInLimiter = rateLimit({
	...baseOptions,
	windowMs: 10 * 60 * 1000,
	limit: 12,
	message: {
		message: "Too many check-in attempts from this device. Try again shortly.",
		code: "RATE_LIMITED",
	},
});

export const captchaLimiter = rateLimit({
	...baseOptions,
	windowMs: 5 * 60 * 1000,
	limit: 30,
	message: {
		message: "Captcha requests limited. Please slow down.",
		code: "RATE_LIMITED",
	},
});
