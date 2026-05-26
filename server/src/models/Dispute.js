import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
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
    amount: {
      type: Number,
    },
    category: {
      type: String,
      enum: [
        "item_not_delivered",
        "wrong_item",
        "quality_issue",
        "not_as_described",
        "payment_issue",
        "other",
      ],
      required: true,
    },
    reason: { type: String, required: true },
    proofFiles: [
      {
        url: String,
        filename: String,
        mimetype: String,
      },
    ],
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "rejected", "reopened"],
      default: "open",
    },
    adminNote: String,
  },
  { timestamps: true }
);

export default mongoose.model("Dispute", disputeSchema);
