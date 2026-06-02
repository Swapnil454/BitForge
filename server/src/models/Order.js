

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    index: true,
  },
  productName: String, // Denormalized for display when product is deleted
  
  // Link to cart order (for cart-based checkout)
  cartOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CartOrder",
  },
  
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: Number, // total
  platformFee: Number,
  sellerAmount: Number,
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },

  razorpayContactId: String,
  razorpayFundAccountId: String,

  isRefunded: {
    type: Boolean,
    default: false,
  },
  refundId: String,

  // Admin review flag
  reviewedByAdmin: {
    type: Boolean,
    default: false,
  },
  reviewedAt: Date,

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0,
  },
  downloadLimit: {
    type: Number,
    default: 5,
  },
  lastDownloadAt: Date,
  downloadHistory: [{
    downloadedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
  }],

  // For direct-to-cloud downloads
  watermarkedR2Key: String,

}, { timestamps: true });

// Indexes to optimize order queries
orderSchema.index({ buyerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ cartOrderId: 1 });

export default mongoose.model("Order", orderSchema);
