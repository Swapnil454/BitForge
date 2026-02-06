

import express from "express";
import { getMarketplaceProducts, getMarketplaceProductById } from "../controllers/marketplace.controller.js";

const router = express.Router();

// Public route
router.get("/", getMarketplaceProducts);
router.get("/:id", getMarketplaceProductById);


export default router;
