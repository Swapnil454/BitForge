

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
  getAllTransactions
} from "../controllers/admin.controller.js";
import {
  approveRefund,
  rejectDispute
} from "../controllers/refund.controller.js"
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

// Dashboard stats
router.get("/dashboard-stats", getDashboardStats);

// Transactions
router.get("/transactions", getAllTransactions);

router.get("/sellers/pending", getPendingSellers);
router.post("/sellers/:id/approve", approveSeller);
router.post("/sellers/:id/reject", rejectSeller);

router.get("/products/pending", getPendingProducts);
router.get("/products/all", getAllProducts);
router.get("/products/:id/details", getProductDetails);
router.put("/products/:id/edit", editProductByAdmin);
router.delete("/products/:id/delete", deleteProductByAdmin);
router.post("/products/:id/approve", approveProduct);
router.post("/products/:id/reject", rejectProduct);

router.get("/products/changes/pending", getPendingProductChanges);
router.post("/products/:id/changes/approve", approveProductChange);
router.post("/products/:id/changes/reject", rejectProductChange);

router.get("/payouts/pending", getPendingPayouts);
router.get("/payouts/all", getAllPayouts);
router.get("/payouts/:id", getPayoutDetails);
router.post("/payouts/:id/approve", approvePayout);
router.post("/payouts/:id/reject", rejectPayout);

// Commission and financial reports
router.get("/commission-summary", getCommissionSummary);

router.get("/disputes/open", getOpenDisputes);

router.post("/disputes/:disputeId/refund", approveRefund);
router.post("/disputes/:disputeId/reject", rejectDispute);

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
router.put("/users/:id/profile", updateUserProfile);
router.delete("/users/:id", deleteUserByAdmin);


export default router;
