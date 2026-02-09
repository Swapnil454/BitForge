import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import { createNotification } from "./notification.controller.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";

const GST_RATE = 0.18;

// Admin tool to manually mark order as paid (for fixing stuck orders when webhook fails)
export const manuallyMarkOrderPaid = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("==> Admin manually marking order as paid:", orderId);

    const order = await Order.findById(orderId)
      .populate('productId', 'title')
      .populate('buyerId', 'email')
      .populate('sellerId', 'name');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "paid") {
      return res.status(400).json({ message: "Order is already marked as paid" });
    }

    // Update order status
    order.status = "paid";
    await order.save();

    console.log("==> ✅ Order manually marked as paid:", order._id);

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: order._id });

    if (!existingInvoice) {
      const gstAmount = order.platformFee * GST_RATE;

      const invoice = await Invoice.create({
        orderId: order._id,
        invoiceNumber: generateInvoiceNumber(),
        buyerEmail: order.buyerId?.email || "buyer@example.com",
        sellerId: order.sellerId,
        productPrice: order.amount,
        platformFee: order.platformFee,
        gstAmount,
        totalPlatformAmount: order.platformFee + gstAmount,
      });

      console.log("==> ✅ Invoice created:", invoice.invoiceNumber);
    }

    // Send notifications
    try {
      const product = await Product.findById(order.productId);

      if (order.buyerId) {
        await createNotification(
          order.buyerId,
          "order_completed",
          "Purchase confirmed",
          `Your purchase of "${product?.title || "a product"}" for ₹${order.amount} has been confirmed`,
          order._id,
          "Order"
        );
      }

      if (order.sellerId) {
        await createNotification(
          order.sellerId,
          "payment_received",
          "Order confirmed",
          `Order for "${product?.title || "your product"}" (₹${order.amount}) has been manually confirmed`,
          order._id,
          "Order"
        );
      }
    } catch (notifyErr) {
      console.error("==> ⚠️ Notification error:", notifyErr.message);
    }

    res.json({
      success: true,
      message: "Order manually marked as paid",
      order: {
        id: order._id,
        status: order.status,
        productName: order.productId?.title,
        amount: order.amount,
      }
    });
  } catch (error) {
    console.error("==> ❌ Error manually marking order paid:", error);
    res.status(500).json({ message: "Failed to mark order as paid", error: error.message });
  }
};

// Get all stuck orders (created status but old)
export const getStuckOrders = async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckOrders = await Order.find({
      status: "created",
      createdAt: { $lt: oneHourAgo }
    })
      .populate('productId', 'title')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name')
      .sort({ createdAt: -1 });

    console.log(`==> Found ${stuckOrders.length} stuck orders`);

    res.json({
      count: stuckOrders.length,
      orders: stuckOrders.map(o => ({
        _id: o._id,
        productName: o.productId?.title || 'Unknown',
        buyerName: o.buyerId?.name || 'Unknown',
        buyerEmail: o.buyerId?.email,
        amount: o.amount,
        razorpayOrderId: o.razorpayOrderId,
        createdAt: o.createdAt,
        ageHours: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60))
      }))
    });
  } catch (error) {
    console.error("==> ❌ Error fetching stuck orders:", error);
    res.status(500).json({ message: "Failed to fetch stuck orders" });
  }
};
