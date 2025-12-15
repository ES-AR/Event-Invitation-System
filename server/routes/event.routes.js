// server/routes/event.routes.js
import express from "express";
import {
  getEventSettings,
  updateEventSettings,
  closeRegistration,
  getEventStats,
} from "../controllers/event.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/settings", getEventSettings);
router.put("/settings", requireAdmin, updateEventSettings);
router.post("/close", requireAdmin, closeRegistration);
router.get("/stats", requireAdmin, getEventStats);

export default router;
