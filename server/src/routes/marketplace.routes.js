

import express from "express";
import { getMarketplaceProducts, getMarketplaceProductById } from "../controllers/marketplace.controller.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public route
router.get("/", getMarketplaceProducts);
router.get("/:id", optionalAuth, getMarketplaceProductById); // Optional auth to check if buyer has purchased


export default router;
