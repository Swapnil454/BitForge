

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { downloadProduct, getDownloadInfo } from "../controllers/download.controller.js";

const router = express.Router();

router.get("/:orderId", auth, requireRole(["buyer"]), downloadProduct);
router.get("/:orderId/info", auth, requireRole(["buyer"]), getDownloadInfo);

export default router;
