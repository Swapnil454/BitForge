

import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reason: String,
  status: {
    type: String,
    enum: ["open", "approved", "rejected"],
    default: "open",
  },
  adminNote: String,
}, { timestamps: true });

export default mongoose.model("Dispute", disputeSchema);
