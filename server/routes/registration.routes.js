// server/routes/registration.routes.js
import express from "express";
import {
	registerUser,
	listAttendees,
	approveAttendee,
	rejectAttendee,
	deleteAttendee,
	getSingleAttendee,
	bulkApproveAttendees,
	bulkRejectAttendees,
	bulkDeleteAttendees,
	exportAttendeesCsv,
	exportAttendeesPdf,
} from "../controllers/registration.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { attendeePhotoUpload } from "../config/multer.js";
import { registrationLimiter } from "../config/rateLimiters.js";

const router = express.Router();

router.post("/", registrationLimiter, attendeePhotoUpload.single("photo"), registerUser);
router.get("/list", requireAdmin, listAttendees);
router.put("/approve/:id", requireAdmin, approveAttendee);
router.put("/reject/:id", requireAdmin, rejectAttendee);
router.delete("/:id", requireAdmin, deleteAttendee);
router.post("/bulk/approve", requireAdmin, bulkApproveAttendees);
router.post("/bulk/reject", requireAdmin, bulkRejectAttendees);
router.post("/bulk/delete", requireAdmin, bulkDeleteAttendees);
router.get("/export/csv", requireAdmin, exportAttendeesCsv);
router.get("/export/pdf", requireAdmin, exportAttendeesPdf);
router.get("/:id", requireAdmin, getSingleAttendee);

export default router;
