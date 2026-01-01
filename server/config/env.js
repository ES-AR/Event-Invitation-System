import "dotenv/config";

export const geocodingConfig = Object.freeze({
	baseUrl: process.env.GEOCODING_BASE_URL || "",
	apiKey: process.env.GEOLOCATION_API_KEY || "",
	provider: process.env.GEOCODING_PROVIDER || "google",
});

export const isGeocodingConfigured = () =>
	Boolean(geocodingConfig.baseUrl && geocodingConfig.apiKey);
