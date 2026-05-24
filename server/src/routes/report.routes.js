import express from "express";
import { submitReport, getAllReports, updateReportStatus, getMyReports } from "../controllers/report.controller.js";
import authMiddleware, { optionalAuth, authMiddlewareAllowBanned } from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../config/multer.js"; // For handling multipart/form-data (Cloudinary uploads)

const router = express.Router();

// Public route: Submit a report (no auth required as banned/deleted users may not have token)
router.post("/", optionalAuth, upload.array("proofs", 5), submitReport);

// User route: Get my reports (allows banned users to track their tickets)
router.get("/my-reports", authMiddlewareAllowBanned, getMyReports);

// Admin routes
router.get("/admin", authMiddleware, requireRole(["admin"]), getAllReports);
router.patch("/admin/:id/status", authMiddleware, requireRole(["admin"]), updateReportStatus);

export default router;
