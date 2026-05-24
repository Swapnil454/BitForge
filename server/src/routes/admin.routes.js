

import express from "express";
import {
  getPendingSellers,
  approveSeller,
  rejectSeller,
  approveProduct,
  getPendingProducts,
  getAllProducts,
  getProductDetails,
  editProductByAdmin,
  deleteProductByAdmin,
  rejectProduct,
  getPendingProductChanges,
  approveProductChange,
  rejectProductChange,
  getPendingPayouts,
  approvePayout,
  rejectPayout,
  getPayoutDetails,
  getAllPayouts,
  getCommissionSummary,
  getOpenDisputes,
  getMonthlyGSTReport,
  getAllSellersWithBankAccounts,
  getSellerBankAccount,
  getAdminBankStats,
  getDashboardStats,
  getPendingSellerDeletions,
  approveSellerDeletion,
  rejectSellerDeletion,
  getAllUsers,
  updateUserProfile,
  deleteUserByAdmin,
  getUserById,
  banUser,
  unbanUser,
  updateUserLimit,
  getAllTransactions,
  bulkMarkTransactionsReviewed,
  getMalwareFlaggedProducts,
  getMalwareDashboardStats,
  getContentReviewQueue,
  resolveContentReview,
  verifySellerIdentity,
  getPendingIdentityVerifications,
  getProductAnalytics,
  getProductReport
} from "../controllers/admin.controller.js";

import {
  approveRefund,
  rejectDispute
} from "../controllers/refund.controller.js";

import {
  approvePromotionAdmin,
  getAdSettingsAdmin,
  getAllPromotionsAdmin,
  getPromotionAdminById,
  pausePromotionAdmin,
  rejectPromotionAdmin,
  resumePromotionAdmin,
  updateAdSettingsAdmin,
  updatePromotionPriorityAdmin,
  verifyPromotionPaymentAdmin,
  updatePromotionStyleAdmin,
} from "../controllers/promotion.controller.js";

import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

// Dashboard stats
router.get("/dashboard-stats", getDashboardStats);

// Transactions
router.get("/transactions", getAllTransactions);
router.post("/transactions/bulk-review", bulkMarkTransactionsReviewed);

// Sellers
router.get("/sellers/pending", getPendingSellers);
router.post("/sellers/:id/approve", approveSeller);
router.post("/sellers/:id/reject", rejectSeller);

// Products
router.get("/products/pending", getPendingProducts);
router.get("/products/all", getAllProducts);
router.get("/products/:id/details", getProductDetails);
router.get("/products/analytics", getProductAnalytics);
router.get("/products/report", getProductReport);
router.put("/products/:id/edit", editProductByAdmin);
router.delete("/products/:id/delete", deleteProductByAdmin);
router.post("/products/:id/approve", approveProduct);
router.post("/products/:id/reject", rejectProduct);

router.get("/products/changes/pending", getPendingProductChanges);
router.post("/products/:id/changes/approve", approveProductChange);
router.post("/products/:id/changes/reject", rejectProductChange);

// Payouts
router.get("/payouts/pending", getPendingPayouts);
router.get("/payouts/all", getAllPayouts);
router.get("/payouts/:id", getPayoutDetails);
router.post("/payouts/:id/approve", approvePayout);
router.post("/payouts/:id/reject", rejectPayout);

// Commission and financial reports
router.get("/commission-summary", getCommissionSummary);

// Disputes
router.get("/disputes/open", getOpenDisputes);
router.post("/disputes/:disputeId/refund", approveRefund);
router.post("/disputes/:disputeId/reject", rejectDispute);

// GST reports
router.get("/reports/gst", getMonthlyGSTReport);

// Bank account management routes
router.get("/sellers/bank-accounts", getAllSellersWithBankAccounts);
router.get("/sellers/:sellerId/bank-account", getSellerBankAccount);
router.get("/bank-stats", getAdminBankStats);

// Seller account deletion management
router.get("/sellers/deletions/pending", getPendingSellerDeletions);
router.post("/sellers/:id/deletions/approve", approveSellerDeletion);
router.post("/sellers/:id/deletions/reject", rejectSellerDeletion);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/profile", updateUserProfile);
router.put("/users/:id/limit", updateUserLimit);
router.delete("/users/:id", deleteUserByAdmin);
router.post("/users/:id/suspend", banUser);
router.post("/users/:id/unban", unbanUser);

// Trust & Security Features
router.get("/security/malware/flagged", getMalwareFlaggedProducts);
router.get("/security/malware/stats", getMalwareDashboardStats);
router.get("/security/content-review/queue", getContentReviewQueue);
router.post("/security/content-review/:id/resolve", resolveContentReview);
router.get("/security/identity/pending", getPendingIdentityVerifications);
router.post("/security/identity/:sellerId/verify", verifySellerIdentity);

// Promotions
router.get("/promotions", getAllPromotionsAdmin);
router.get("/promotions/:id", getPromotionAdminById);
router.patch("/promotions/:id/approve", approvePromotionAdmin);
router.patch("/promotions/:id/reject", rejectPromotionAdmin);
router.patch("/promotions/:id/verify-payment", verifyPromotionPaymentAdmin);
router.patch("/promotions/:id/pause", pausePromotionAdmin);
router.patch("/promotions/:id/resume", resumePromotionAdmin);
router.patch("/promotions/:id/priority", updatePromotionPriorityAdmin);
router.patch("/promotions/:id/style", updatePromotionStyleAdmin);

// Ad settings
router.get("/ad-settings", getAdSettingsAdmin);
router.put("/ad-settings", updateAdSettingsAdmin);

export default router;
