const store = new Map();

const pruneExpired = () => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (entry.expiresAt && entry.expiresAt <= now) {
			store.delete(key);
		}
	}
};

setInterval(pruneExpired, 60_000).unref?.();

export const setItem = (key, value, ttlMs = 0) => {
	const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
	store.set(key, { value, expiresAt });
};

export const getItem = (key) => {
	pruneExpired();
	const entry = store.get(key);
	if (!entry) return null;
	if (entry.expiresAt && entry.expiresAt <= Date.now()) {
		store.delete(key);
		return null;
	}
	return entry.value;
};

export const removeItem = (key) => {
	store.delete(key);
};
