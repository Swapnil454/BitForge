import crypto from "crypto";
import Order from "../models/Order.js";
import CartOrder from "../models/CartOrder.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";
import Invoice from "../models/Invoice.js";
import {
  handlePromotionOrderPaid,
  handlePromotionPaymentCaptured,
  handlePromotionPaymentFailed,
} from "./promotion.controller.js";
import { sendSaleNotificationEmail, sendBuyerInvoiceEmail } from "../utils/moderationEmails.js";

import { applyWatermark } from "../utils/watermark.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET_NAME } from "../config/r2.js";

// Helper to generate watermark and upload to R2
const generateAndUploadWatermarkedFile = async (order, product, buyer) => {
  if (!product || !product.fileKey || !buyer) return null;
  try {
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: product.fileKey,
    });
    const { Body } = await r2Client.send(getCommand);
    const fileByteArray = await Body.transformToByteArray();
    const fileBuffer = Buffer.from(fileByteArray);

    const buyerInfo = {
      buyerName: buyer.name || buyer.email.split('@')[0],
      buyerEmail: buyer.email,
      orderId: order._id.toString(),
      purchaseDate: new Date().toLocaleDateString(),
      productName: product.title
    };

    const { buffer: watermarkedBuffer, filename } = await applyWatermark(
      fileBuffer,
      product.fileName || "download",
      buyerInfo
    );

    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const watermarkedR2Key = `purchases/${order._id}/${safeFilename}`;

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: watermarkedR2Key,
      Body: watermarkedBuffer,
      ContentType: product.fileType || "application/octet-stream"
    });

    await r2Client.send(putCommand);
    console.log(`==> 💧 Watermarked file uploaded to R2: ${watermarkedR2Key}`);
    return watermarkedR2Key;
  } catch (error) {
    console.error(`==> ❌ Watermark generation failed for order ${order._id}:`, error);
    return null;
  }
};

// Tax rates aligned with Invoice model
const GST_RATE = 0.05; // 5% GST
const PLATFORM_FEE_RATE = 0.02; // 2% platform fee

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

    console.log(`    Order created for: ${item.productName} (₹${item.itemTotal.toFixed(2)})`);

    // Background watermark generation
    generateAndUploadWatermarkedFile(order, product, buyer).then(async (watermarkedR2Key) => {
      if (watermarkedR2Key) {
        await Order.findByIdAndUpdate(order._id, { watermarkedR2Key });
      }
    });

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

    console.log(`    Invoice created: ${invoiceNumber}`);

    // Notify seller (in-app) + send seller sale email
    try {
      await createNotification(
        item.sellerId,
        "payment_received",
        "New order paid",
        `${buyer?.name || buyer?.email || payment.email || "A buyer"} bought "${item.productName}" for ₹${item.itemTotal.toFixed(2)}`,
        order._id,
        "Order"
      );
    } catch (err) {
      console.log(`    Failed to notify seller: ${err.message}`);
    }

    // Seller sale email
    if (seller?.email) {
      sendSaleNotificationEmail(
        seller,
        buyer,
        item.productName,
        item.sellerAmount,
        invoiceNumber,
        order._id
      ).catch(e => console.error('[Email] Seller sale email failed:', e.message));
    }

    // Buyer invoice email (per item)
    if (buyer?.email) {
      sendBuyerInvoiceEmail(buyer, {
        invoiceNumber,
        invoiceDate: new Date(),
        productName: item.productName,
        productDescription: product?.description?.substring(0, 100) || 'Digital download',
        originalPrice: item.originalPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount: item.originalPrice * ((item.discountPercent || 0) / 100),
        priceAfterDiscount: item.finalPrice,
        gstRate: GST_RATE,
        gstAmount: item.gst,
        platformFee: item.platformFee,
        totalAmount: item.itemTotal,
        razorpayPaymentId: payment.id,
        paymentMethod: payment.method || 'Razorpay',
      }).catch(e => console.error('[Email] Buyer invoice email failed:', e.message));
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
    console.log("==>  Buyer notified");
  } catch (err) {
    console.log(`==>  Failed to notify buyer: ${err.message}`);
  }

  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin._id,
          "admin_purchase_alert",
          "New marketplace purchase",
          `${buyer?.email || "A buyer"} completed a cart purchase worth Rs. ${cartOrder.totalAmount.toFixed(2)}.`,
          cartOrder._id,
          "CartOrder",
          {
            audienceRole: "admin",
          }
        )
      )
    );
  } catch (err) {
    console.log(`==>  Failed to notify admins: ${err.message}`);
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
      console.error("==>  CRITICAL: RAZORPAY_WEBHOOK_SECRET not properly configured!");
      console.error("==> Current value:", secret);
      console.error("==> Get real webhook secret from: https://dashboard.razorpay.com/app/webhooks");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }

    const receivedSignature = req.headers["x-razorpay-signature"];
    const payloadBuffer =
      req.rawBody || Buffer.from(JSON.stringify(req.body || {}), "utf8");
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadBuffer)
      .digest("hex");

    if (generatedSignature !== receivedSignature) {
      console.error("==>  Invalid webhook signature!");
      console.error("==> Expected:", generatedSignature.substring(0, 20) + "...");
      console.error("==> Received:", receivedSignature?.substring(0, 20) + "...");
      console.error("==> This means RAZORPAY_WEBHOOK_SECRET is incorrect!");
      return res.status(400).json({ message: "Invalid signature" });
    }

    console.log("==>  Webhook signature verified");
    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      console.log("==> 💰 Payment captured:", payment.id);
      console.log("==> Order ID:", payment.order_id);
      console.log("==> Amount:", payment.amount / 100, "INR");

      const promotion = await handlePromotionPaymentCaptured(payment);
      if (promotion) {
        console.log("==> Promotion payment captured:", promotion._id);
        console.log("==> ///////////////////////////////////////////////////////////");
        return res.json({ status: "ok" });
      }

      // Check if this is a CART order and atomically update status
      const cartOrder = await CartOrder.findOneAndUpdate(
        { razorpayOrderId: payment.order_id, status: { $ne: "paid" } },
        { 
          status: "paid",
          razorpayPaymentId: payment.id,
          paidAt: new Date()
        },
        { new: true }
      );

      // If we didn't get a cartOrder, it either doesn't exist or is already paid
      if (!cartOrder) {
        // Let's check if it exists but is already paid
        const existingCartOrder = await CartOrder.findOne({ razorpayOrderId: payment.order_id });
        if (existingCartOrder) {
          console.log("==> ℹ️ Cart order already processed, skipping");
          return res.json({ status: "ok" });
        }
      }

      if (cartOrder) {

        await processCartOrder(cartOrder, payment);

        console.log("==>  Cart order processed successfully");
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
        console.error("==>  Order not found for razorpayOrderId:", payment.order_id);
        return res.json({ status: "ok" });
      }

      console.log("==>  Order updated to PAID:", order._id);
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

        // Background watermark generation
        generateAndUploadWatermarkedFile(order, product, buyer).then(async (watermarkedR2Key) => {
          if (watermarkedR2Key) {
            await Order.findByIdAndUpdate(order._id, { watermarkedR2Key });
          }
        });

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

        console.log("==>  Invoice created:", invoice.invoiceNumber);
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
              `${buyer?.name || buyer?.email || payment.email || "A buyer"} bought "${product?.title || "your product"}" for ₹${order.amount}`,
              order._id,
              "Order"
            );
            console.log("==> ✅ Seller notified");
          }
          const admins = await User.find({ role: "admin" }).select("_id");
          await Promise.all(
            admins.map((admin) =>
              createNotification(
                admin._id,
                "admin_purchase_alert",
                "New marketplace purchase",
                `${buyer?.email || payment.email || "A buyer"} completed a purchase worth Rs. ${order.amount}.`,
                order._id,
                "Order",
                {
                  audienceRole: "admin",
                }
              )
            )
          );
        } catch (notifyErr) {
          console.error("==> ❌ Notification error:", notifyErr.message);
        }

        // Seller sale email
        const sellerDoc = await User.findById(order.sellerId).select('name email').lean();
        if (sellerDoc?.email) {
          sendSaleNotificationEmail(
            sellerDoc,
            buyer,
            product?.title || order.productName || 'Digital Product',
            order.sellerAmount,
            invoice.invoiceNumber,
            order._id
          ).catch(e => console.error('[Email] Seller sale email failed:', e.message));
        }

        // Buyer invoice email
        if (buyer?.email) {
          sendBuyerInvoiceEmail(buyer, {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            productName: product?.title || order.productName || 'Digital Product',
            productDescription: product?.description?.substring(0, 100) || 'Digital download',
            originalPrice,
            discountPercent,
            discountAmount,
            priceAfterDiscount,
            gstRate: GST_RATE,
            gstAmount,
            platformFee,
            totalAmount,
            razorpayPaymentId: payment.id,
            paymentMethod: payment.method || 'Razorpay',
          }).catch(e => console.error('[Email] Buyer invoice email failed:', e.message));
        }
      } else {
        console.log("==> ℹ️ Invoice already exists, skipping creation");
      }

      console.log("==>  Webhook processed successfully");
      console.log("==> ///////////////////////////////////////////////////////////");
    }

    if (event === "order.paid") {
      const orderEntity = req.body.payload.order?.entity;
      const promotion = await handlePromotionOrderPaid(orderEntity);

      if (promotion) {
        console.log("==> Promotion order paid:", promotion._id);
        console.log("==> ///////////////////////////////////////////////////////////");
        return res.json({ status: "ok" });
      }
    }

    if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;
      const failureReason =
        payment.error_description ||
        payment.error_reason ||
        "Payment could not be completed.";

      const promotion = await handlePromotionPaymentFailed(payment, failureReason);
      if (promotion) {
        console.log("==> Promotion payment failed:", promotion._id);
        console.log("==> ///////////////////////////////////////////////////////////");
        return res.json({ status: "ok" });
      }

      const cartOrder = await CartOrder.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { status: "failed" },
        { new: true }
      );

      if (cartOrder?.buyerId) {
        await createNotification(
          cartOrder.buyerId,
          "payment_failed",
          "Purchase failed",
          `Your cart payment could not be completed. ${failureReason}`,
          cartOrder._id,
          "CartOrder",
          {
            audienceRole: "buyer",
          }
        );
      }

      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { status: "failed" },
        { new: true }
      );

      if (order?.buyerId) {
        await createNotification(
          order.buyerId,
          "payment_failed",
          "Purchase failed",
          `Your payment for "${order.productName || "your order"}" could not be completed. ${failureReason}`,
          order._id,
          "Order",
          {
            audienceRole: "buyer",
          }
        );
      }

      const admins = await User.find({ role: "admin" }).select("_id");
      await Promise.all(
        admins.map((admin) =>
          createNotification(
            admin._id,
            "payment_failed",
            "Payment failed",
            `A payment attempt failed for Razorpay order ${payment.order_id}.`,
            order?._id || cartOrder?._id || null,
            order ? "Order" : "CartOrder",
            {
              audienceRole: "admin",
            }
          )
        )
      );
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("==>  Webhook error:", error);
    console.error("==> ///////////////////////////////////////////////////////////");
    res.status(500).json({ message: "Webhook processing failed", error: error.message });
  }
};
