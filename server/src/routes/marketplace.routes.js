
import express from "express";
import { getMarketplaceProducts, getMarketplaceProductById } from "../controllers/marketplace.controller.js";
import {
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
} from "../controllers/search.controller.js";
import authMiddleware, { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Search ────────────────────────────────────────────────────────────────────
router.get("/search/suggestions", getSearchSuggestions);                    // public
router.get("/search/history", authMiddleware, getSearchHistory);             // auth required
router.post("/search/history", optionalAuth, saveSearchHistory);             // saves only for logged-in
router.delete("/search/history/all", authMiddleware, clearSearchHistory);    // clear all
router.delete("/search/history/:query", authMiddleware, deleteSearchHistoryItem); // remove one

// ── Products ──────────────────────────────────────────────────────────────────
router.get("/", getMarketplaceProducts);
router.get("/:id", optionalAuth, getMarketplaceProductById);

export default router;
