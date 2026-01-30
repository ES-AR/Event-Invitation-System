import crypto from "crypto";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const sanitize = (value = "") => value.replace(/[^a-zA-Z0-9]/g, "");

const randomReadableChunk = (size = 4) => {
	let output = "";
	for (let i = 0; i < size; i += 1) {
		const index = crypto.randomInt(0, TOKEN_ALPHABET.length);
		output += TOKEN_ALPHABET[index];
	}
	return output;
};

export function hashCheckInToken(token = "") {
	return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function createCheckInToken() {
	const token = `${randomReadableChunk(4)}-${randomReadableChunk(4)}`;
	return {
		token,
		hash: hashCheckInToken(token),
		hint: token.slice(-3),
	};
}

export function buildTicketCode(source = "") {
	const cleaned = sanitize(source).toUpperCase();
	const prefix = (cleaned.slice(0, 3) || "EVT").padEnd(3, "X");
	const numeric = crypto.randomInt(0, 1000).toString().padStart(3, "0");
	return `#${prefix}-${numeric}`;
}

export const obfuscateTokenHint = (hint = "") => (hint ? `Ends with ${hint}` : "No token issued");
