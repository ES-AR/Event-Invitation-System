// geocode.routes.js
import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import { searchGeocode } from "../controllers/geocode.controller.js";

const router = express.Router();

router.get("/search", requireAdmin, searchGeocode);

export default router;
