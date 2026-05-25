import mongoose from 'mongoose';

const ModerationLogSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productTitle: {
    type: String,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: {
    type: String,
  },
  action: {
    type: String,
    enum: [
      'approved', 'rejected', 'changes_requested',
      'scan_product_removed', 'scan_seller_notified', 'scan_whitelisted', 'scan_rescan_triggered'
    ],
    required: true,
  },
  reasons: [{
    type: String,
  }],
  adminNote: {
    type: String,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sellerEmail: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
  },
});

// Indexes for fast querying as per requirements
ModerationLogSchema.index({ timestamp: -1 });
ModerationLogSchema.index({ productId: 1, timestamp: -1 });
ModerationLogSchema.index({ adminId: 1, timestamp: -1 });
ModerationLogSchema.index({ action: 1, timestamp: -1 });

const ModerationLog = mongoose.model('ModerationLog', ModerationLogSchema);
export default ModerationLog;
