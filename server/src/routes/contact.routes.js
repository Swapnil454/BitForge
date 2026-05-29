import express from "express";
import { submitContactMessage, getInquiries, deleteInquiry, markInquiryRead } from "../controllers/contact.controller.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Public endpoint: no auth required
router.post("/", submitContactMessage);

// Admin-only endpoints
router.get("/admin", authMiddleware, requireRole("admin"), getInquiries);
router.delete("/admin/:id", authMiddleware, requireRole("admin"), deleteInquiry);
router.patch("/admin/:id/read", authMiddleware, requireRole("admin"), markInquiryRead);

export default router;
