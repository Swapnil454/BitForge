

import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  amount: Number, // Total amount seller requested to withdraw
  
  // Financial breakdown
  totalEarnings: Number, // Total earnings from sales
  platformCommission: Number, // Commission taken by platform (10% of sales)
  gstOnCommission: Number, // GST on commission (18% of commission)
  totalDeductions: Number, // platformCommission + gstOnCommission
  netPayableAmount: Number, // Amount to be paid to seller after deductions
  
  status: {
    type: String,
    enum: ["pending", "processing", "paid", "rejected"],
    default: "pending",
  },
  rejectionReason: String,
  
  // Manual payment tracking
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Admin who processed the payment
  },
  paidAt: Date,
  paymentMethod: {
    type: String,
    enum: ["manual", "bank_transfer", "upi", "razorpayx"],
    default: "manual",
  },
  paymentReference: String, // UTR number or reference from admin
  paymentNotes: String, // Admin notes about the payment
  
  // Legacy RazorpayX fields (commented out for future use)
  // razorpayPayoutId: String,
  // failureReason: String,

}, { timestamps: true });

export default mongoose.model("Payout", payoutSchema);
