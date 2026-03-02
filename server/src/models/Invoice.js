

import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Buyer details
  buyerName: String,
  buyerEmail: String,
  buyerAddress: String,
  
  // Seller details
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sellerName: String,
  
  // Product details
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  productName: String,
  productDescription: String,
  
  // Pricing breakdown
  originalPrice: Number,
  discountPercent: Number,
  discountAmount: Number,
  priceAfterDiscount: Number,
  gstRate: {
    type: Number,
    default: 0.05, // 5% GST
  },
  gstAmount: Number,
  platformFeeRate: {
    type: Number,
    default: 0.02, // 2% platform fee
  },
  platformFee: Number,
  totalAmount: Number,
  
  // Payment details
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentMethod: {
    type: String,
    default: "Razorpay",
  },
  
  // Timestamps
  invoiceDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const prefix = `BF-${year}-`;
  
  // Find the latest invoice number for this year
  const latestInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  if (latestInvoice) {
    const lastNum = parseInt(latestInvoice.invoiceNumber.split('-')[2], 10);
    nextNumber = lastNum + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

export default mongoose.model("Invoice", invoiceSchema);
