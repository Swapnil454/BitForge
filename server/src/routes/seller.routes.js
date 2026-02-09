

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import {
  getSellerDashboardStats,
  getSellerEarnings,
  requestWithdrawal,
  cancelPayoutRequest,
  getSellerTransactions,
  getAllSales,
  getGrowthAnalytics,
} from "../controllers/seller.controller.js";

const router = express.Router();

router.use(auth, requireRole(["seller"]));

router.get("/dashboard-stats", getSellerDashboardStats);
router.get("/earnings", getSellerEarnings);
router.get("/transactions", getSellerTransactions);
router.get("/sales", getAllSales);
router.get("/growth-analytics", getGrowthAnalytics);
router.post("/withdraw", requestWithdrawal);
router.delete("/withdraw/:payoutId", cancelPayoutRequest);

export default router;
