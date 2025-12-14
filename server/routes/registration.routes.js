// server/routes/registration.routes.js
import express from "express";
import {
  registerUser,
  checkInAttendee,
  getSingleAttendee,
} from "../controllers/registration.controller.js";

const router = express.Router();

// Public → register attendee
router.post("/", registerUser);

// Public → load details for check-in via email link
router.get("/:regId", getSingleAttendee);

// Public → submit check‑in form
router.post("/:regId/checkin", checkInAttendee);

export default router;
