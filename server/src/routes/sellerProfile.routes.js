import express from "express";
import {
  getSellerProfile,
  getSellerProducts,
  getSellerReviews,
  updateSellerProfile
} from "../controllers/sellerProfile.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Public routes - anyone can view seller profiles
router.get("/:sellerId", getSellerProfile);
router.get("/:sellerId/products", getSellerProducts);
router.get("/:sellerId/reviews", getSellerReviews);

// Protected routes - sellers updating their own profile
router.patch("/profile", auth, updateSellerProfile);

export default router;
