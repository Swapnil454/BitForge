import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createNotification } from "./notification.controller.js";
import Invoice from "../models/Invoice.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";

const GST_RATE = 0.18;

export const razorpayWebhook = async (req, res) => {
  console.log("==> Webhook received:", req.body.event);
  
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("==> RAZORPAY_WEBHOOK_SECRET not configured!");
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  const shasum = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (shasum !== req.headers["x-razorpay-signature"]) {
    console.error("==> Invalid webhook signature");
    return res.status(400).json({ message: "Invalid signature" });
  }

  const event = req.body.event;

  if (event === "payment.captured") {
    const payment = req.body.payload.payment.entity;
    console.log("==> Payment captured:", payment.id, "for order:", payment.order_id);

    // 1️⃣ Update order
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        razorpayPaymentId: payment.id,
        status: "paid",
      },
      { new: true } // IMPORTANT: get updated order
    );

    if (!order) {
      console.error("==> Order not found for razorpayOrderId:", payment.order_id);
      return res.json({ status: "ok" });
    }

    console.log("==> Order updated:", order._id);

    // 2️⃣ Safety check (webhooks can retry)
    const existingInvoice = await Invoice.findOne({ orderId: order?._id });

    // 3️⃣ Create invoice (only once)
    if (!existingInvoice && order) {
      const gstAmount = order.platformFee * GST_RATE;

      await Invoice.create({
        orderId: order._id,
        invoiceNumber: generateInvoiceNumber(),
        buyerEmail: payment.email || "buyer@example.com",
        sellerId: order.sellerId,
        productPrice: order.amount,
        platformFee: order.platformFee,
        gstAmount,
        totalPlatformAmount: order.platformFee + gstAmount,
      });

      // 4️⃣ Notify buyer and seller about the purchase
      try {
        const product = await Product.findById(order.productId);

        if (order?.buyerId) {
          await createNotification(
            order.buyerId,
            "order_completed",
            "Purchase successful",
            `You purchased "${product?.title || "a product"}" for ₹${order.amount}`,
            order._id,
            "Order"
          );
        }

        if (order?.sellerId) {
          await createNotification(
            order.sellerId,
            "payment_received",
            "New order paid",
            `${payment.email || "A buyer"} bought "${product?.title || "your product"}" for ₹${order.amount}`,
            order._id,
            "Order"
          );
        }
      } catch (notifyErr) {
        console.error("Notification error (order payment):", notifyErr);
      }
    }
  }

  res.json({ status: "ok" });
};
