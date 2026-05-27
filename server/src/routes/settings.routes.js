import express from "express";
import { getLegalDates, updateLegalDates } from "../controllers/settings.controller.js";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.route("/legal-dates")
  .get(getLegalDates)
  .put(authMiddleware, requireRole(["admin"]), updateLegalDates);

export default router;
