// server/routes/registration.routes.js
import express from "express";
import {
  registerUser,
  listAttendees,
  approveAttendee,
  deleteAttendee,
  sendCheckInLink,
  getSingleAttendee,
  checkInAttendee,
} from "../controllers/registration.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/", registerUser);
router.get("/list", requireAdmin, listAttendees);
router.put("/approve/:id", requireAdmin, approveAttendee);
router.delete("/:id", requireAdmin, deleteAttendee);
router.post("/send-checkin/:id", requireAdmin, sendCheckInLink);
router.post("/checkin/:token", checkInAttendee);
router.get("/:id", requireAdmin, getSingleAttendee);

export default router;
