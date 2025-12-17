// server/routes/registration.routes.js
import express from "express";
import {
  registerUser,
  getCaptchaChallenge,
  listAttendees,
  approveAttendee,
  deleteAttendee,
  sendCheckInLink,
  getSingleAttendee,
  getCheckInDetails,
  checkInAttendee,
  bulkApproveAttendees,
  bulkDeleteAttendees,
  exportAttendeesCsv,
  exportAttendeesPdf,
} from "../controllers/registration.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { checkInUpload } from "../config/multer.js";
import {
  captchaLimiter,
  checkInLimiter,
  registrationLimiter,
} from "../config/rateLimiters.js";

const router = express.Router();

router.get("/captcha", captchaLimiter, getCaptchaChallenge);
router.post("/", registrationLimiter, registerUser);
router.get("/list", requireAdmin, listAttendees);
router.put("/approve/:id", requireAdmin, approveAttendee);
router.delete("/:id", requireAdmin, deleteAttendee);
router.post("/send-checkin/:id", requireAdmin, sendCheckInLink);
router.post("/bulk/approve", requireAdmin, bulkApproveAttendees);
router.post("/bulk/delete", requireAdmin, bulkDeleteAttendees);
router.get("/export/csv", requireAdmin, exportAttendeesCsv);
router.get("/export/pdf", requireAdmin, exportAttendeesPdf);
router.get("/checkin/:token", getCheckInDetails);
router.post(
  "/checkin/:token",
  checkInLimiter,
  checkInUpload.single("photo"),
  checkInAttendee
);
router.get("/:id", requireAdmin, getSingleAttendee);

export default router;
