// geocode.controller.js
import { geocodeAddress } from "../services/geocoding.service.js";

export const searchGeocode = async (req, res) => {
  try {
    const query = (req.query.query || req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const results = await geocodeAddress(query);
    res.json({ results });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    console.error("Geocode lookup failed:", error.message);
    res.status(statusCode).json({ message: error.message || "Unable to search for that location" });
  }
};
