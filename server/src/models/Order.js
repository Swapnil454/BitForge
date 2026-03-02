

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

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0,
  },
  downloadLimit: {
    type: Number,
    default: 5, // Max downloads allowed
  },
  lastDownloadAt: Date,
  downloadHistory: [{
    downloadedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
  }],

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
