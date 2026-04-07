import express from "express";
import requireCheckIn from "../middleware/requireCheckIn.js";
import {
  startCheckInSession,
  searchAttendees,
  getAttendee,
  markAttendeePresent,
  undoCheckIn,
} from "../controllers/checkin.controller.js";

const router = express.Router();

router.post("/:slug/session", requireCheckIn, startCheckInSession);
router.get("/:slug/attendees", requireCheckIn, searchAttendees);
router.get("/:slug/attendees/:attendeeId", requireCheckIn, getAttendee);
router.post("/:slug/attendees/:attendeeId/checkin", requireCheckIn, markAttendeePresent);
router.post("/:slug/attendees/:attendeeId/undo", requireCheckIn, undoCheckIn);

export default router;
