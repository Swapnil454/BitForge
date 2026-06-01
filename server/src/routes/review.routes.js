import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  canReview,
  addSellerResponse
} from "../controllers/review.controller.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes (require authentication)
router.use(auth);

router.post("/", upload.array("images", 3), createReview);
router.get("/can-review/:productId", canReview);
router.patch("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);
router.post("/:reviewId/response", addSellerResponse);

export default router;
