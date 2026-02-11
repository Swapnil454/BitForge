import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 1000,
  },
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0,
  },
  // Admin moderation
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenReason: {
    type: String,
  },
  // Seller response
  sellerResponse: {
    text: String,
    respondedAt: Date,
  },
}, { timestamps: true });

// Compound index to prevent duplicate reviews
reviewSchema.index({ productId: 1, buyerId: 1 }, { unique: true });

// Index for fetching product reviews
reviewSchema.index({ productId: 1, createdAt: -1 });

// Index for fetching seller reviews
reviewSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
