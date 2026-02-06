

import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  invoiceNumber: String,
  buyerEmail: String,
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  productPrice: Number,
  platformFee: Number,
  gstAmount: Number,
  totalPlatformAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Invoice", invoiceSchema);
