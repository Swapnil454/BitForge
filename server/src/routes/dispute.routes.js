import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../middleware/upload.js";
import { createDispute } from "../controllers/dispute.controller.js";
import { getBuyerDisputes, getBuyerDisputeAnalytics } from "../controllers/buyerDispute.controller.js";

const router = express.Router();

router.post(
  "/",
  auth,
  requireRole(["buyer"]),
  upload.array("proofFiles", 3),
  createDispute
);

router.get("/my/analytics", auth, requireRole(["buyer"]), getBuyerDisputeAnalytics);
router.get("/my", auth, requireRole(["buyer"]), getBuyerDisputes);

export default router;
