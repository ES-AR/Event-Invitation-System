import express from "express";
import { loginAdmin, getCurrentAdmin, registerAdmin } from "../controllers/auth.controller.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/register", registerAdmin);
router.get("/me", requireAdmin, getCurrentAdmin);

export default router;