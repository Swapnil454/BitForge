import mongoose from "mongoose";

const downloadLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productFileName: {
    type: String,
  },
  storageProvider: {
    type: String,
    enum: ["cloudinary", "r2"],
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  downloadType: {
    type: String,
    enum: ["watermarked", "signed-url"],
    required: true,
  },
  buyerName: String,
  buyerEmail: String,
  watermarkText: String,
  signedUrlExpiresAt: Date,
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
  downloadedAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model("DownloadLog", downloadLogSchema);
