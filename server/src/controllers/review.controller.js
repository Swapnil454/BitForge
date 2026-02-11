import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { addSellerRating } from "../utils/sellerStats.js";

/**
 * Create a review for a purchased product
 * POST /api/reviews
 */
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    // Validation
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: "Product ID, Order ID, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify order exists and belongs to buyer
    const order = await Order.findOne({
      _id: orderId,
      buyerId: req.user.id,
      productId: productId,
      status: { $in: ["completed", "delivered", "paid", "success"] } // Only allow reviews for completed orders
    });

    if (!order) {
      return res.status(403).json({ 
        message: "Order not found or you haven't purchased this product yet" 
      });
    }

    // Get product to find seller
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      productId: productId,
      buyerId: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: "You have already reviewed this product. You can edit your existing review." 
      });
    }

    // Create review
    const review = await Review.create({
      productId,
      buyerId: req.user.id,
      sellerId: product.sellerId,
      orderId,
      rating: Number(rating),
      comment: comment?.trim() || "",
    });

    // Update seller's average rating
    await addSellerRating(product.sellerId, Number(rating));

    // Populate buyer info for response
    const populatedReview = await Review.findById(review._id)
      .populate("buyerId", "name profilePictureUrl");

    res.status(201).json({
      message: "Review submitted successfully",
      review: populatedReview
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

/**
 * Get reviews for a product
 * GET /api/reviews/product/:productId
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      productId: productId,
      isHidden: false
    })
      .populate("buyerId", "name profilePictureUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      productId: productId,
      isHidden: false
    });

    // Calculate rating distribution
    const ratingCounts = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), isHidden: false } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingCounts.forEach(item => {
      distribution[item._id] = item.count;
    });

    // Calculate average rating
    const avgResult = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), isHidden: false } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    const averageRating = avgResult.length > 0 ? avgResult[0].avgRating : 0;
    const totalReviews = avgResult.length > 0 ? avgResult[0].totalReviews : 0;

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
        distribution
      }
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

/**
 * Update user's own review
 * PATCH /api/reviews/:reviewId
 */
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      buyerId: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or you don't have permission" });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await review.save();

    // Recalculate seller rating
    const product = await Product.findById(review.productId);
    if (product) {
      const sellerReviews = await Review.find({ sellerId: product.sellerId, isHidden: false });
      const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / sellerReviews.length;
      
      await User.findByIdAndUpdate(product.sellerId, {
        averageRating: parseFloat(avgRating.toFixed(2)),
        ratingCount: sellerReviews.length
      });
    }

    const updatedReview = await Review.findById(reviewId)
      .populate("buyerId", "name profilePictureUrl");

    res.json({
      message: "Review updated successfully",
      review: updatedReview
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
};

/**
 * Delete user's own review
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      buyerId: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or you don't have permission" });
    }

    const sellerId = review.sellerId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate seller rating
    const sellerReviews = await Review.find({ sellerId: sellerId, isHidden: false });
    if (sellerReviews.length > 0) {
      const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / sellerReviews.length;
      
      await User.findByIdAndUpdate(sellerId, {
        averageRating: parseFloat(avgRating.toFixed(2)),
        ratingCount: sellerReviews.length
      });
    } else {
      await User.findByIdAndUpdate(sellerId, {
        averageRating: 0,
        ratingCount: 0
      });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

/**
 * Check if user can review a product
 * GET /api/reviews/can-review/:productId
 */
export const canReview = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if user has purchased the product
    const order = await Order.findOne({
      buyerId: req.user.id,
      productId: productId,
      status: { $in: ["completed", "delivered", "paid", "success"] }
    });

    if (!order) {
      return res.json({ canReview: false, reason: "You haven't purchased this product" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      productId: productId,
      buyerId: req.user.id
    });

    if (existingReview) {
      return res.json({ 
        canReview: false, 
        reason: "You have already reviewed this product",
        existingReview 
      });
    }

    res.json({ canReview: true, orderId: order._id });
  } catch (error) {
    console.error("Can review check error:", error);
    res.status(500).json({ message: "Failed to check review eligibility" });
  }
};

/**
 * Seller adds response to a review
 * POST /api/reviews/:reviewId/response
 */
export const addSellerResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Response text is required" });
    }

    const review = await Review.findOne({
      _id: reviewId,
      sellerId: req.user.id // Only seller can respond
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or you don't have permission" });
    }

    review.sellerResponse = {
      text: text.trim(),
      respondedAt: new Date()
    };

    await review.save();

    const updatedReview = await Review.findById(reviewId)
      .populate("buyerId", "name profilePictureUrl");

    res.json({
      message: "Response added successfully",
      review: updatedReview
    });
  } catch (error) {
    console.error("Add seller response error:", error);
    res.status(500).json({ message: "Failed to add response" });
  }
};
