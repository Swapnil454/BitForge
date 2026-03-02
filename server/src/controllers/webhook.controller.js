import crypto from "crypto";
import Order from "../models/Order.js";
import CartOrder from "../models/CartOrder.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";
import Invoice from "../models/Invoice.js";

// Tax rates aligned with Invoice model
const GST_RATE = 0.05; // 5% GST
const PLATFORM_FEE_RATE = 0.02; // 2% platform fee

// Process cart order payment
const processCartOrder = async (cartOrder, payment) => {
  console.log("==> 🛒 Processing CART order with", cartOrder.items.length, "items");
  
  const buyer = await User.findById(cartOrder.buyerId);
  const createdOrders = [];
  
  // Create individual Order records for each item
  for (const item of cartOrder.items) {
    const product = await Product.findById(item.productId);
    const seller = await User.findById(item.sellerId);
    
    // Create Order for this product
    const order = await Order.create({
      buyerId: cartOrder.buyerId,
      sellerId: item.sellerId,
      productId: item.productId,
      productName: item.productName,
      cartOrderId: cartOrder._id,
      razorpayOrderId: cartOrder.razorpayOrderId,
      razorpayPaymentId: payment.id,
      amount: item.itemTotal,
      platformFee: item.platformFee,
      sellerAmount: item.sellerAmount,
      status: "paid",
    });
    
    // Update cart order item with order reference
    item.orderId = order._id;
    
    createdOrders.push({ order, product, seller });
    
    console.log(`   ✅ Order created for: ${item.productName} (₹${item.itemTotal.toFixed(2)})`);
    
    // Create invoice for this item
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    
    await Invoice.create({
      orderId: order._id,
      invoiceNumber,
      invoiceDate: new Date(),
      buyerId: cartOrder.buyerId,
      buyerName: buyer?.name || 'Valued Customer',
      buyerEmail: payment.email || buyer?.email || "buyer@example.com",
      sellerId: item.sellerId,
      sellerName: seller?.name || 'BitForge Seller',
      productId: item.productId,
      productName: item.productName,
      productDescription: product?.description?.substring(0, 100) || 'Digital download',
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      discountAmount: item.originalPrice * (item.discountPercent / 100),
      priceAfterDiscount: item.finalPrice,
      gstRate: GST_RATE,
      gstAmount: item.gst,
      platformFeeRate: PLATFORM_FEE_RATE,
      platformFee: item.platformFee,
      totalAmount: item.itemTotal,
      productPrice: item.originalPrice,
      totalPlatformAmount: item.platformFee + item.gst,
      razorpayOrderId: cartOrder.razorpayOrderId,
      razorpayPaymentId: payment.id,
      paymentMethod: payment.method || 'Razorpay',
    });
    
    console.log(`   ✅ Invoice created: ${invoiceNumber}`);
    
    // Notify seller
    try {
      await createNotification(
        item.sellerId,
        "payment_received",
        "New order paid",
        `${buyer?.email || payment.email || "A buyer"} bought "${item.productName}" for ₹${item.itemTotal.toFixed(2)}`,
        order._id,
        "Order"
      );
    } catch (err) {
      console.log(`   ⚠️ Failed to notify seller: ${err.message}`);
    }
  }
  
  // Save updated cart order with order references
  await cartOrder.save();
  
  // Clear user's cart
  await Cart.findOneAndUpdate(
    { userId: cartOrder.buyerId },
    { $set: { items: [], updatedAt: new Date() } }
  );
  console.log("==> 🗑️ Cart cleared for user");
  
  // Notify buyer (single notification for entire purchase)
  try {
    const productNames = cartOrder.items.map(i => i.productName).join(", ");
    await createNotification(
      cartOrder.buyerId,
      "order_completed",
      "Purchase successful",
      `You purchased ${cartOrder.items.length} item(s): ${productNames} for ₹${cartOrder.totalAmount.toFixed(2)}`,
      cartOrder._id,
      "CartOrder"
    );
    console.log("==> ✅ Buyer notified");
  } catch (err) {
    console.log(`==> ⚠️ Failed to notify buyer: ${err.message}`);
  }
  
  return createdOrders;
};

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

      // Check if this is a CART order
      const cartOrder = await CartOrder.findOne({ razorpayOrderId: payment.order_id });
      
      if (cartOrder) {
        // Process cart order
        if (cartOrder.status === "paid") {
          console.log("==> ℹ️ Cart order already processed, skipping");
          return res.json({ status: "ok" });
        }
        
        cartOrder.razorpayPaymentId = payment.id;
        cartOrder.status = "paid";
        cartOrder.paidAt = new Date();
        
        await processCartOrder(cartOrder, payment);
        
        console.log("==> ✅ Cart order processed successfully");
        console.log("==> ///////////////////////////////////////////////////////////");
        return res.json({ status: "ok" });
      }

      // Fall back to single-product order (backward compatibility)
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

      // Safety check (webhooks can retry)
      const existingInvoice = await Invoice.findOne({ orderId: order?._id });

      // Create invoice (only once)
      if (!existingInvoice && order) {
        const product = await Product.findById(order.productId);
        const buyer = await User.findById(order.buyerId);
        const seller = await User.findById(order.sellerId);

        const originalPrice = order.amount;
        const discountPercent = product?.discount || 0;
        const discountAmount = originalPrice * (discountPercent / 100);
        const priceAfterDiscount = originalPrice - discountAmount;
        const gstAmount = priceAfterDiscount * GST_RATE;
        const platformFee = priceAfterDiscount * PLATFORM_FEE_RATE;
        const totalAmount = priceAfterDiscount + gstAmount + platformFee;

        const invoiceNumber = await Invoice.generateInvoiceNumber();

        const invoice = await Invoice.create({
          orderId: order._id,
          invoiceNumber,
          invoiceDate: new Date(),
          buyerId: order.buyerId,
          buyerName: buyer?.name || 'Valued Customer',
          buyerEmail: payment.email || buyer?.email || order.buyerId?.email || "buyer@example.com",
          sellerId: order.sellerId,
          sellerName: seller?.name || 'BitForge Seller',
          productId: order.productId,
          productName: product?.title || order.productName || 'Digital Product',
          productDescription: product?.description?.substring(0, 100) || 'Digital download',
          originalPrice,
          discountPercent,
          discountAmount,
          priceAfterDiscount,
          gstRate: GST_RATE,
          gstAmount,
          platformFeeRate: PLATFORM_FEE_RATE,
          platformFee,
          totalAmount,
          productPrice: originalPrice,
          totalPlatformAmount: platformFee + gstAmount,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          paymentMethod: payment.method || 'Razorpay',
        });

        console.log("==> ✅ Invoice created:", invoice.invoiceNumber);
        console.log("==> Total Amount: ₹", totalAmount.toFixed(2));

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
