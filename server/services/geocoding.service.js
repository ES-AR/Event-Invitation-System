// geocoding.service.js

import fetch from "node-fetch";
import { geocodingConfig, isGeocodingConfigured } from "../config/env.js";

const RESULT_LIMIT = 5;
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const GOOGLE_HEADERS = { Accept: "application/json" };
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "EventInvitationSystem/1.0",
};

const createGeocodeError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatResult = (result) => {
  const latitude =
    toNumber(result?.geometry?.location?.lat) ?? toNumber(result?.lat);
  const longitude =
    toNumber(result?.geometry?.location?.lng) ??
    toNumber(result?.lon ?? result?.lng);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    id:
      result.place_id ||
      result.osm_id ||
      result.formatted_address ||
      result.display_name ||
      `${latitude},${longitude}`,
    label:
      result.formatted_address ||
      result.display_name ||
      result.name ||
      "Unlabeled location",
    latitude,
    longitude,
  };
};

const buildGoogleRequest = (query) => {
  let targetUrl;
  try {
    targetUrl = new URL(geocodingConfig.baseUrl);
  } catch (error) {
    throw createGeocodeError("Invalid geocoding base URL", 500);
  }

  targetUrl.searchParams.set("address", query);
  targetUrl.searchParams.set("key", geocodingConfig.apiKey);

  return {
    url: targetUrl.toString(),
    headers: GOOGLE_HEADERS,
  };
};

const buildNominatimRequest = (query) => {
  const targetUrl = new URL(NOMINATIM_BASE_URL);
  targetUrl.searchParams.set("q", query);
  targetUrl.searchParams.set("format", "json");
  targetUrl.searchParams.set("addressdetails", "1");
  targetUrl.searchParams.set("limit", String(RESULT_LIMIT));

  return {
    url: targetUrl.toString(),
    headers: NOMINATIM_HEADERS,
  };
};

const parseGooglePayload = (payload) => {
  const providerStatus = payload?.status;

  if (providerStatus === "ZERO_RESULTS") {
    return [];
  }

  if (providerStatus !== "OK" || !Array.isArray(payload?.results)) {
    throw createGeocodeError(
      payload?.error_message || `Geocoding failed (${providerStatus || "UNKNOWN"})`,
      providerStatus === "REQUEST_DENIED" ? 401 : 502
    );
  }

  return payload.results;
};

const parseNominatimPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.error) {
    throw createGeocodeError(payload.error, 502);
  }

  throw createGeocodeError("Geocoding provider returned an unexpected response", 502);
};

const selectProvider = () => {
  const preferred = (geocodingConfig.provider || "").toLowerCase();

  if (preferred === "nominatim") {
    return "nominatim";
  }

  if (preferred === "google") {
    if (isGeocodingConfigured()) {
      return "google";
    }

    console.warn(
      "Geocoding provider is set to Google but missing credentials, falling back to Nominatim"
    );
    return "nominatim";
  }

  return isGeocodingConfigured() ? "google" : "nominatim";
};

export async function geocodeAddress(query) {
  if (!query) {
    throw createGeocodeError("Query is required", 400);
  }

  const provider = selectProvider();
  const requestConfig =
    provider === "google" ? buildGoogleRequest(query) : buildNominatimRequest(query);

  let response;
  try {
    response = await fetch(requestConfig.url, { headers: requestConfig.headers });
  } catch (networkError) {
    throw createGeocodeError("Unable to reach geocoding provider", 504);
  }

  if (!response.ok) {
    const statusForError = [401, 403, 429].includes(response.status)
      ? response.status
      : 502;
    throw createGeocodeError(`Geocoding request failed (${response.status})`, statusForError);
  }

  const payload = await response.json();
  const providerResults =
    provider === "google" ? parseGooglePayload(payload) : parseNominatimPayload(payload);

  return providerResults.slice(0, RESULT_LIMIT).map(formatResult).filter(Boolean);
}
