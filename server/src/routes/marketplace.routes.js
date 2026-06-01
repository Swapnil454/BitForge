
import express from "express";
import { getMarketplaceProducts, getMarketplaceProductById, getMarketplaceProductBySlug, getProductsByCategorySlug } from "../controllers/marketplace.controller.js";
import {
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
} from "../controllers/search.controller.js";
import authMiddleware, { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Cache public listings for 30 seconds (stale-while-revalidate keeps it feeling instant)
const cachePublic = (req, res, next) => { res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60"); next(); };

// ── Search ────────────────────────────────────────────────────────────────────
router.get("/search/suggestions", getSearchSuggestions);                    // public
router.get("/search/history", authMiddleware, getSearchHistory);             // auth required
router.post("/search/history", optionalAuth, saveSearchHistory);             // saves only for logged-in
router.delete("/search/history/all", authMiddleware, clearSearchHistory);    // clear all
router.delete("/search/history/:query", authMiddleware, deleteSearchHistoryItem); // remove one

// ── Products ──────────────────────────────────────────────────────────────────
router.get("/", cachePublic, getMarketplaceProducts);
router.get("/slug/:slug", cachePublic, getMarketplaceProductBySlug);
router.get("/categories/:slug/products", cachePublic, getProductsByCategorySlug);
router.get("/:id", optionalAuth, getMarketplaceProductById);

export default router;
