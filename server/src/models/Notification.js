import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "order_completed", 
      "download_ready", 
      "product_approved", 
      "product_rejected",
      "product_pending_review",
      "product_update_requested",
      "product_deletion_requested",
      "product_change_approved",
      "product_change_rejected",
      "product_edited_by_admin",
      "product_deleted_by_admin",
      "price_drop", 
      "payment_received", 
      "payout_sent",
      "user_deleted",
      "seller_deletion_requested",
      "seller_deletion_approved",
      "seller_deletion_rejected",
      "account_deleted_by_admin",
      "profile_edited_by_admin"
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Order", "Product", "User"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: "📬",
  },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
