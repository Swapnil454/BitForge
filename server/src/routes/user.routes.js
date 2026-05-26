import express from "express";
import authMiddleware from "../middleware/auth.js";
import upload from "../config/multer.js";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  requestAccountDeletion,
  confirmAccountDeletion,
  requestReactivationOtp,
  reactivateAccount,
  updatePreferences,
  uploadIdentityDocuments,
  getIdentityStatus,
} from "../controllers/user.controller.js";
import { validateIdentityDocuments } from "../middleware/fileValidation.js";
import rateLimit from "express-rate-limit";
import MongoStore from "rate-limit-mongo";
import dotenv from "dotenv";

dotenv.config();

const identityUploadLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI || process.env.MONGO_URI,
    collectionName: "rateLimitIdentityUploads",
    expireTimeMs: 24 * 60 * 60 * 1000, // 24 hours
  }),
  windowMs: 24 * 60 * 60 * 1000,
  max: 3, // max 3 submission attempts per day
  message: { message: "Too many upload attempts. Please try again tomorrow." },
});

const router = express.Router();

// Protected routes
router.get("/profile", authMiddleware, getCurrentUser);
router.patch("/profile", authMiddleware, upload.single("profilePicture"), updateProfile);
router.patch("/preferences", authMiddleware, updatePreferences);
router.post("/change-password", authMiddleware, changePassword);

// Identity Verification routes
router.post("/identity/upload", authMiddleware, identityUploadLimiter, upload.array("documents", 5), validateIdentityDocuments, uploadIdentityDocuments);
router.get("/identity/status", authMiddleware, getIdentityStatus);

// Public routes (for password reset)
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Account deletion routes
router.post("/request-account-deletion", authMiddleware, requestAccountDeletion);
router.post("/confirm-account-deletion", authMiddleware, confirmAccountDeletion);

// Account reactivation routes (public)
router.post("/request-reactivation-otp", requestReactivationOtp);
router.post("/reactivate-account", reactivateAccount);

export default router;
