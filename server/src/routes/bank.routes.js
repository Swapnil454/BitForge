

import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { 
  addBankAccount, 
  getBankAccounts, 
  getPrimaryBankAccount,
  setPrimaryAccount,
  updateBankAccount, 
  deleteBankAccount 
} from "../controllers/bank.controller.js";

const router = express.Router();

// Sellers and Admins can manage their bank accounts
router.post(
  "/add",
  auth,
  requireRole(["seller", "admin"]),
  addBankAccount
);

router.get(
  "/",
  auth,
  requireRole(["seller", "admin"]),
  getBankAccounts
);

router.get(
  "/primary",
  auth,
  requireRole(["seller", "admin"]),
  getPrimaryBankAccount
);

router.patch(
  "/:accountId/set-primary",
  auth,
  requireRole(["seller", "admin"]),
  setPrimaryAccount
);

router.put(
  "/:accountId",
  auth,
  requireRole(["seller", "admin"]),
  updateBankAccount
);

router.delete(
  "/:accountId",
  auth,
  requireRole(["seller", "admin"]),
  deleteBankAccount
);

export default router;
