// server/routes/event.routes.js
import express from "express";
import {
  listOrganizerEvents,
  createEvent,
  getEventSettings,
  updateEventSettings,
  deleteEvent,
  closeRegistration,
  openRegistration,
  getEventStats,
  getPublicEvent,
} from "../controllers/event.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/public", getPublicEvent);
router.get("/public/:slug", getPublicEvent);

router.get("/", requireAdmin, listOrganizerEvents);
router.post("/", requireAdmin, createEvent);
router.get("/:eventId", requireAdmin, getEventSettings);
router.put("/:eventId", requireAdmin, updateEventSettings);
router.delete("/:eventId", requireAdmin, deleteEvent);
router.post("/:eventId/close", requireAdmin, closeRegistration);
router.post("/:eventId/open", requireAdmin, openRegistration);
router.get("/:eventId/stats", requireAdmin, getEventStats);

export default router;
