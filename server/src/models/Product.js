
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  description: String,
  price: Number,
  discount: {
    type: Number,
    default: 0,
  },
  fileKey: String, // Cloudinary public_id
  fileUrl: String, // Cloudinary secure_url
  thumbnailKey: String, // Cloudinary public_id for thumbnail
  thumbnailUrl: String, // Cloudinary secure_url for thumbnail
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
  },
  // Change request tracking for approved products
  changeRequest: {
    type: String,
    enum: ["none", "pending_update", "pending_deletion"],
    default: "none",
  },
  pendingChanges: {
    title: String,
    description: String,
    price: Number,
    discount: Number,
    fileKey: String,
    fileUrl: String,
    thumbnailKey: String,
    thumbnailUrl: String,
  },
  changeRejectionReason: String,
  
  // Admin edit and delete tracking
  deletedByAdmin: {
    type: Boolean,
    default: false,
  },
  deleteReason: {
    type: String,
  },
  deletedAt: {
    type: Date,
  },

}, { timestamps: true });

export default mongoose.model("Product", productSchema);
