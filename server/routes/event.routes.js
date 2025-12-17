// server/routes/event.routes.js
import express from "express";
import {
  getEventSettings,
  updateEventSettings,
  closeRegistration,
  openRegistration,
  getEventStats,
  getPublicEvent,
} from "../controllers/event.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/public/:slug?", getPublicEvent);

router.get("/settings", requireAdmin, getEventSettings);
router.put("/settings", requireAdmin, updateEventSettings);
router.post("/close", requireAdmin, closeRegistration);
router.post("/open", requireAdmin, openRegistration);
router.get("/stats", requireAdmin, getEventStats);

export default router;
