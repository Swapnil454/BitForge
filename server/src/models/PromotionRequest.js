import mongoose from "mongoose";

export const PROMOTION_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED_WAITING_PAYMENT",
  "REJECTED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "ACTIVE",
  "PAUSED",
  "EXPIRED",
  "CANCELLED",
];

export const PROMOTION_PAYMENT_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "PAID",
  "FAILED",
];

export const PROMOTION_PAYMENT_METHODS = ["MANUAL", "RAZORPAY"];

export const PROMOTION_PLACEMENTS = ["MARKETPLACE_HERO"];

const promotionRequestSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productTitle: {
      type: String,
      required: true,
      trim: true,
    },
    productThumbnailUrl: {
      type: String,
      default: null,
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    placement: {
      type: String,
      enum: PROMOTION_PLACEMENTS,
      default: "MARKETPLACE_HERO",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImage: {
      type: String,
      required: true,
    },
    bannerImageKey: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: "View Product",
      trim: true,
    },
    targetLink: {
      type: String,
      default: null,
      trim: true,
    },
    promotionGoal: {
      type: String,
      default: "",
      trim: true,
    },
    requestedDurationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    approvedDurationDays: {
      type: Number,
      min: 1,
      default: null,
    },
    amount: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    status: {
      type: String,
      enum: PROMOTION_STATUSES,
      default: "PENDING_REVIEW",
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    sellerNote: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: PROMOTION_PAYMENT_STATUSES,
      default: "NOT_REQUIRED",
    },
    paymentMethod: {
      type: String,
      enum: PROMOTION_PAYMENT_METHODS,
      default: "RAZORPAY",
    },
    paymentProofImage: {
      type: String,
      default: null,
    },
    paymentProofImageKey: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: Number,
      default: 999,
      min: 1,
    },
    startDate: {
      type: Date,
      default: null,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    maxImpressions: {
      type: Number,
      default: null,
      min: 1,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    ordersGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenueGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedReason: {
      type: String,
      default: "",
      trim: true,
    },
    paymentSubmittedAt: {
      type: Date,
      default: null,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

promotionRequestSchema.index({
  placement: 1,
  status: 1,
  startDate: 1,
  endDate: 1,
  priority: 1,
});

export default mongoose.model("PromotionRequest", promotionRequestSchema);
