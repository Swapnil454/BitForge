import mongoose from "mongoose";

// Cart Order Item Schema (embedded)
const cartOrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productName: String,
  quantity: {
    type: Number,
    default: 1,
  },
  originalPrice: Number,
  discountPercent: Number,
  finalPrice: Number, // Price after discount
  gst: Number,
  platformFee: Number,
  sellerAmount: Number,
  itemTotal: Number, // finalPrice + gst + platformFee
  
  // Link to individual Order document (created after payment)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
});

// Main Cart Order Schema
const cartOrderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Cart items
  items: [cartOrderItemSchema],
  
  // Totals
  subtotal: Number, // Sum of all finalPrices
  totalGst: Number,
  totalPlatformFee: Number,
  totalAmount: Number, // Final amount charged
  
  // Razorpay details
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: String,
  
  // Status
  status: {
    type: String,
    enum: ["created", "paid", "failed", "refunded"],
    default: "created",
  },
  
  // Payment metadata
  paidAt: Date,
  
}, { timestamps: true });

// Index for faster lookups
cartOrderSchema.index({ buyerId: 1, status: 1 });

export default mongoose.model("CartOrder", cartOrderSchema);
