// server/routes/event.routes.js
import express from "express";
import {
  getEventSettings,
  updateEventSettings,
} from "../controllers/event.controller.js";

const router = express.Router();

// Public → load event config
router.get("/", getEventSettings);

// Admin → update event config
router.post("/", updateEventSettings);

export default router;
