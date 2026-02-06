import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getBuyerStats,
  getBuyerSpendingOverTime,
  getWishlistCount,
  getAllBuyerTransactions,
  getBuyerTransactionDetails,
  getAllBuyerPurchases,
  getBuyerPurchaseDetails,
} from "../controllers/buyer.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get buyer dashboard stats
router.get("/stats", getBuyerStats);

// Get spending over time
router.get("/spending-over-time", getBuyerSpendingOverTime);

// Get wishlist count
router.get("/wishlist-count", getWishlistCount);

// Get all buyer transactions
router.get("/transactions", getAllBuyerTransactions);

// Get single transaction details
router.get("/transactions/:orderId", getBuyerTransactionDetails);

// Get all buyer purchases (paid orders only)
router.get("/purchases", getAllBuyerPurchases);

// Get single purchase details
router.get("/purchases/:purchaseId", getBuyerPurchaseDetails);

export default router;