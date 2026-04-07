// server/routes/admin.routes.js
import express from "express";
import {
  getAllAttendees,
  approveAttendee,
  deleteAttendee,
  bulkApprove,
  bulkDelete,
  exportToExcel,
  exportToPDF,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Admin → fetch all attendees
router.get("/attendees", getAllAttendees);

// Admin → approve
router.post("/attendees/:id/approve", approveAttendee);

// Admin → delete
router.delete("/attendees/:id", deleteAttendee);

// Admin → bulk approve
router.post("/attendees/bulk/approve", bulkApprove);

// Admin → bulk delete
router.post("/attendees/bulk/delete", bulkDelete);

// Admin → export
router.get("/attendees/export/excel", exportToExcel);
router.get("/attendees/export/pdf", exportToPDF);

export default router;
