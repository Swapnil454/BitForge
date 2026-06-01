

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
  getAllTransactionsForSeller,
  getSellerReviews,
} from "../controllers/seller.controller.js";
import {
  cancelSellerPromotion,
  createPromotionPaymentOrder,
  createPromotionRequest,
  getSellerPromotionById,
  getSellerPromotions,
  verifyPromotionPayment,
  uploadPromotionPaymentProof,
  deleteSellerPromotion,
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.use(auth, requireRole(["seller"]));

router.get("/dashboard-stats", getSellerDashboardStats);
router.get("/earnings", getSellerEarnings);
router.get("/transactions", getSellerTransactions);
router.get("/transactions/all", getAllTransactionsForSeller);
router.get("/sales", getAllSales);
router.get("/growth-analytics", getGrowthAnalytics);
router.post("/withdraw", requestWithdrawal);
router.delete("/withdraw/:payoutId", cancelPayoutRequest);
router.post(
  "/promotions",
  upload.fields([
    { name: "adImages", maxCount: 3 },
    { name: "bannerCard", maxCount: 1 },
  ]),
  createPromotionRequest
);
router.get("/promotions", getSellerPromotions);
router.get("/promotions/:id", getSellerPromotionById);
router.delete("/promotions/:id", deleteSellerPromotion);
router.patch("/promotions/:id/cancel", cancelSellerPromotion);
router.post("/promotions/:id/create-payment-order", createPromotionPaymentOrder);
router.post("/promotions/:id/verify-payment", verifyPromotionPayment);
router.post(
  "/promotions/:id/payment-proof",
  upload.single("paymentProof"),
  uploadPromotionPaymentProof
);

router.get("/reviews", getSellerReviews);

export default router;
