import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";
import Invoice from "../models/Invoice.js";

// Tax rates aligned with Invoice model
const GST_RATE = 0.05; // 5% GST
const PLATFORM_FEE_RATE = 0.02; // 2% platform fee

export const razorpayWebhook = async (req, res) => {
  try {
    console.log("==> ///////////////////////////////////////////////////////////");
    console.log("==> Webhook received:", req.body.event);
    console.log("==> Timestamp:", new Date().toISOString());
    
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || secret === 'xxxx' || secret === 'your_webhook_secret') {
      console.error("==> ❌ CRITICAL: RAZORPAY_WEBHOOK_SECRET not properly configured!");
      console.error("==> Current value:", secret);
      console.error("==> Get real webhook secret from: https://dashboard.razorpay.com/app/webhooks");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }

    const receivedSignature = req.headers["x-razorpay-signature"];
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== receivedSignature) {
      console.error("==> ❌ Invalid webhook signature!");
      console.error("==> Expected:", generatedSignature.substring(0, 20) + "...");
      console.error("==> Received:", receivedSignature?.substring(0, 20) + "...");
      console.error("==> This means RAZORPAY_WEBHOOK_SECRET is incorrect!");
      return res.status(400).json({ message: "Invalid signature" });
    }

    console.log("==> ✅ Webhook signature verified");
    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      console.log("==> 💰 Payment captured:", payment.id);
      console.log("==> Order ID:", payment.order_id);
      console.log("==> Amount:", payment.amount / 100, "INR");

      // 1️⃣ Update order
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: "paid",
        },
        { new: true }
      ).populate('productId', 'title').populate('buyerId', 'email').populate('sellerId', 'name');

      if (!order) {
        console.error("==> ❌ Order not found for razorpayOrderId:", payment.order_id);
        return res.json({ status: "ok" });
      }

      console.log("==> ✅ Order updated to PAID:", order._id);
      console.log("==> Product:", order.productId?.title);
      console.log("==> Buyer:", order.buyerId?.email);
      console.log("==> Platform Fee: ₹", order.platformFee);
      console.log("==> Seller Amount: ₹", order.sellerAmount);

      // 2️⃣ Safety check (webhooks can retry)
      const existingInvoice = await Invoice.findOne({ orderId: order?._id });

      // 3️⃣ Create invoice (only once)
      if (!existingInvoice && order) {
        // Fetch full product and buyer details
        const product = await Product.findById(order.productId);
        const buyer = await User.findById(order.buyerId);
        const seller = await User.findById(order.sellerId);

        // Calculate pricing
        const originalPrice = order.amount;
        const discountPercent = product?.discount || 0;
        const discountAmount = originalPrice * (discountPercent / 100);
        const priceAfterDiscount = originalPrice - discountAmount;
        const gstAmount = priceAfterDiscount * GST_RATE;
        const platformFee = priceAfterDiscount * PLATFORM_FEE_RATE;
        const totalAmount = priceAfterDiscount + gstAmount + platformFee;

        // Generate invoice number using model static method
        const invoiceNumber = await Invoice.generateInvoiceNumber();

        const invoice = await Invoice.create({
          orderId: order._id,
          invoiceNumber,
          invoiceDate: new Date(),
          
          // Buyer details
          buyerId: order.buyerId,
          buyerName: buyer?.name || 'Valued Customer',
          buyerEmail: payment.email || buyer?.email || order.buyerId?.email || "buyer@example.com",
          
          // Seller details
          sellerId: order.sellerId,
          sellerName: seller?.name || 'BitForge Seller',
          
          // Product details
          productId: order.productId,
          productName: product?.title || order.productName || 'Digital Product',
          productDescription: product?.description?.substring(0, 100) || 'Digital download',
          
          // Pricing breakdown
          originalPrice,
          discountPercent,
          discountAmount,
          priceAfterDiscount,
          gstRate: GST_RATE,
          gstAmount,
          platformFeeRate: PLATFORM_FEE_RATE,
          platformFee,
          totalAmount,
          
          // Legacy field (for backward compatibility)
          productPrice: originalPrice,
          totalPlatformAmount: platformFee + gstAmount,
          
          // Payment details  
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          paymentMethod: payment.method || 'Razorpay',
        });

        console.log("==> ✅ Invoice created:", invoice.invoiceNumber);
        console.log("==> Total Amount: ₹", totalAmount.toFixed(2));

        // 4️⃣ Notify buyer and seller about the purchase
        try {
          if (order?.buyerId) {
            await createNotification(
              order.buyerId,
              "order_completed",
              "Purchase successful",
              `You purchased "${product?.title || "a product"}" for ₹${order.amount}`,
              order._id,
              "Order"
            );
            console.log("==> ✅ Buyer notified");
          }

          if (order?.sellerId) {
            await createNotification(
              order.sellerId,
              "payment_received",
              "New order paid",
              `${buyer?.email || payment.email || "A buyer"} bought "${product?.title || "your product"}" for ₹${order.amount}`,
              order._id,
              "Order"
            );
            console.log("==> ✅ Seller notified");
          }
        } catch (notifyErr) {
          console.error("==> ⚠️ Notification error:", notifyErr.message);
        }
      } else {
        console.log("==> ℹ️ Invoice already exists, skipping creation");
      }

      console.log("==> ✅ Webhook processed successfully");
      console.log("==> ///////////////////////////////////////////////////////////");
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("==> ❌ Webhook error:", error);
    console.error("==> ///////////////////////////////////////////////////////////");
    res.status(500).json({ message: "Webhook processing failed", error: error.message });
  }
};
