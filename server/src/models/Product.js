
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
  previewPdfKey: String, // Cloudinary public_id for preview PDF
  previewPdfUrl: String, // Cloudinary secure_url for preview PDF (public)
  
  // B. Structured Product Validation - Mandatory fields
  pageCount: {
    type: Number,
    required: true,
  },
  fileSizeBytes: {
    type: Number,
    required: true,
  },
  language: {
    type: String,
    required: true,
    default: "English",
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  format: {
    type: String,
    enum: ["PDF", "EPUB", "ZIP", "DOCX", "Other"],
    required: true,
    default: "PDF",
  },
  intendedAudience: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
    required: true,
    default: "All Levels",
  },
  
  // A. Content Preview - Preview page URLs (watermarked)
  previewPages: [{
    pageNumber: Number,
    imageUrl: String, // Cloudinary URL for watermarked preview
    imageKey: String, // Cloudinary public_id
  }],
  
  // D. Platform-verified checklist
  malwareScanned: {
    type: Boolean,
    default: false,
  },
  malwareScanDate: {
    type: Date,
  },
  virusTotalId: {
    type: String,
  },
  virusTotalLink: {
    type: String,
  },
  malwareScanDetails: {
    detections: {
      malicious: Number,
      suspicious: Number,
      harmless: Number,
      undetected: Number,
    },
    basicCheckOnly: Boolean,
  },
  contentReviewed: {
    type: String,
    enum: ["not-reviewed", "auto-reviewed", "manually-reviewed"],
    default: "not-reviewed",
  },
  contentReviewDate: {
    type: Date,
  },
  refundEligible: {
    type: Boolean,
    default: true,
  },
  
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
    previewPdfKey: String,
    previewPdfUrl: String,
    pageCount: Number,
    fileSizeBytes: Number,
    language: String,
    format: String,
    intendedAudience: String,
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
