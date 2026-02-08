import express from "express";
import {
  getPublicCareers,
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
  updateCareerStatus,
  getCareerStats,
} from "../controllers/career.controller.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Public routes
router.get("/", getPublicCareers);
router.get("/:id", getCareerById);

// Admin routes
router.get("/admin/all", authMiddleware, requireRole(["admin"]), getAllCareers);
router.get("/admin/stats", authMiddleware, requireRole(["admin"]), getCareerStats);
router.post("/admin/create", authMiddleware, requireRole(["admin"]), createCareer);
router.put("/admin/:id", authMiddleware, requireRole(["admin"]), updateCareer);
router.delete("/admin/:id", authMiddleware, requireRole(["admin"]), deleteCareer);
router.patch("/admin/:id/status", authMiddleware, requireRole(["admin"]), updateCareerStatus);

export default router;
