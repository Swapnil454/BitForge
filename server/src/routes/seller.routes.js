

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import upload from "../middleware/upload.js";
import {
  getSellerDashboardStats,
  getSellerEarnings,
  requestWithdrawal,
  cancelPayoutRequest,
  getSellerTransactions,
  getAllSales,
  getGrowthAnalytics,
} from "../controllers/seller.controller.js";
import {
  cancelSellerPromotion,
  createPromotionPaymentOrder,
  createPromotionRequest,
  getSellerPromotionById,
  getSellerPromotions,
  verifyPromotionPayment,
  uploadPromotionPaymentProof,
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.use(auth, requireRole(["seller"]));

router.get("/dashboard-stats", getSellerDashboardStats);
router.get("/earnings", getSellerEarnings);
router.get("/transactions", getSellerTransactions);
router.get("/sales", getAllSales);
router.get("/growth-analytics", getGrowthAnalytics);
router.post("/withdraw", requestWithdrawal);
router.delete("/withdraw/:payoutId", cancelPayoutRequest);
router.post("/promotions", upload.array("adImages", 3), createPromotionRequest);
router.get("/promotions", getSellerPromotions);
router.get("/promotions/:id", getSellerPromotionById);
router.patch("/promotions/:id/cancel", cancelSellerPromotion);
router.post("/promotions/:id/create-payment-order", createPromotionPaymentOrder);
router.post("/promotions/:id/verify-payment", verifyPromotionPayment);
router.post(
  "/promotions/:id/payment-proof",
  upload.single("paymentProof"),
  uploadPromotionPaymentProof
);

export default router;
