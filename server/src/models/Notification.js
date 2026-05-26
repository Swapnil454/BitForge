import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "transaction",
        "payout",
        "moderation",
        "chat",
        "security",
        "account",
        "promotion",
        "support",
        "system",
        "dispute",
      ],
      default: "system",
    },
    audienceRole: {
      type: String,
      enum: ["buyer", "seller", "admin"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    actionLabel: {
      type: String,
      default: "Open",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    source: {
      name: {
        type: String,
        default: "BitForge",
      },
      logoUrl: {
        type: String,
        default: "/icon.png",
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    pushDelivery: {
      status: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped", "disabled"],
        default: "disabled",
      },
      messageId: String,
      error: String,
      lastAttemptAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
