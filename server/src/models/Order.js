

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


}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
