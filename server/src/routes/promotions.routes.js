import express from "express";
import {
  getActivePromotions,
  recordPromotionClick,
  recordPromotionImpression,
} from "../controllers/promotion.controller.js";

const router = express.Router();

// Cache active promotions for 60 seconds in the browser/CDN
const cacheFor = (req, res, next) => { res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30"); next(); };

router.get("/active", cacheFor, getActivePromotions);
router.post("/:id/impression", recordPromotionImpression);
router.post("/:id/click", recordPromotionClick);

export default router;
