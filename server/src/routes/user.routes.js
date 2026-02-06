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
} from "../controllers/user.controller.js";

const router = express.Router();

// Protected routes
router.get("/profile", authMiddleware, getCurrentUser);
router.patch("/profile", authMiddleware, upload.single("profilePicture"), updateProfile);
router.post("/change-password", authMiddleware, changePassword);

// Public routes (for password reset)
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Account deletion routes
router.post("/request-account-deletion", authMiddleware, requestAccountDeletion);
router.post("/confirm-account-deletion", authMiddleware, confirmAccountDeletion);

export default router;
