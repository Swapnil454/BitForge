
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  description: String,
  category: {
    type: String,
    default: "Software"
  },
  price: Number,
  discount: {
    type: Number,
    default: 0,
  },
  fileKey: String, // Cloudinary public_id or R2 object key
  fileUrl: String, // Cloudinary secure_url (legacy)
  fileName: String,
  fileSize: Number,
  fileType: String,
  storageProvider: {
    type: String,
    enum: ["cloudinary", "r2"],
    default: "r2",
  },
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
  scanStatus: {
    type: String,
    enum: ["PENDING", "SCANNING", "CLEAN", "FLAGGED", "MALICIOUS", "SCAN_FAILED", "MANUALLY_REVIEWED"],
    // nullable, no default initially for zero-downtime migration
  },
  scanLockedAt: {
    type: Date,
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
  requiresManualReview: { 
    type: Boolean, 
    default: false,
    index: true
  },
  reviewSeverity: { 
    type: String, 
    enum: ['high', 'medium', 'low', null], 
    default: null 
  },
  reviewFlags: [{ 
    type: String 
  }],
  reviewScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  refundEligible: {
    type: Boolean,
    default: true,
  },
  
  status: {
    type: String,
    enum: ["pending", "processing", "approved", "rejected"],
    default: "pending",
  },
  // Soft delete - product remains accessible to buyers who purchased
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
    category: String,
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
