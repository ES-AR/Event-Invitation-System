import crypto from "crypto";
import { getItem, removeItem, setItem } from "./memoryStore.js";

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const KEY_PREFIX = "captcha:";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const createCaptchaChallenge = () => {
	const left = randomInt(10, 99);
	const right = randomInt(1, 9);
	const operator = Math.random() > 0.5 ? "-" : "+";
	const answer = operator === "+" ? left + right : left - right;
	const token = crypto.randomUUID();

	setItem(`${KEY_PREFIX}${token}`, { answer }, CAPTCHA_TTL_MS);

	return {
		token,
		prompt: `${left} ${operator} ${right} = ?`,
		expiresIn: CAPTCHA_TTL_MS,
	};
};

export const verifyCaptchaResponse = (token, rawAnswer) => {
	if (!token) return false;
	const key = `${KEY_PREFIX}${token}`;
	const record = getItem(key);
	if (!record) {
		return false;
	}

	removeItem(key);

	const expected = Number(record.answer);
	const provided = Number(rawAnswer);
	return Number.isFinite(provided) && provided === expected;
};
