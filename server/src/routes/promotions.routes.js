import express from "express";
import {
  getActivePromotions,
  recordPromotionClick,
  recordPromotionImpression,
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.get("/active", getActivePromotions);
router.post("/:id/impression", recordPromotionImpression);
router.post("/:id/click", recordPromotionClick);

export default router;
