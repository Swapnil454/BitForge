

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { createDispute } from "../controllers/dispute.controller.js";

const router = express.Router();

router.post(
  "/",
  auth,
  requireRole(["buyer"]),
  createDispute
);

export default router;
