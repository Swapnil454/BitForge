


import razorpay from "../config/razorpay.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    return res.status(404).json({ message: "Product not found" });
  }

  // Calculate final price after discount (matching frontend logic)
  const finalPrice = product.discount > 0 
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  // Calculate GST (5% on final price)
  const gst = finalPrice * 0.05;

  // Calculate platform fee (2% on final price)
  const platformFee = finalPrice * 0.02;

  // Calculate total amount
  const totalAmount = finalPrice + gst + platformFee;

  // Calculate seller amount (final price - platform fee, GST goes to seller)
  const sellerAmount = finalPrice + gst - platformFee;

  // Convert to paise for Razorpay (keep exact decimal, Razorpay accepts paise)
  const amountInPaise = Math.round(totalAmount * 100);

  console.log('💰 Payment Calculation:');
  console.log(`   Original Price: ₹${product.price}`);
  console.log(`   Discount: ${product.discount}%`);
  console.log(`   Final Price: ₹${finalPrice.toFixed(2)}`);
  console.log(`   GST (5%): ₹${gst.toFixed(2)}`);
  console.log(`   Platform Fee (2%): ₹${platformFee.toFixed(2)}`);
  console.log(`   Total Amount: ₹${totalAmount.toFixed(2)} (${amountInPaise} paise)`);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const order = await Order.create({
    buyerId: req.user.id,
    sellerId: product.sellerId,
    productId: product._id,
    razorpayOrderId: razorpayOrder.id,
    amount: totalAmount, // Store exact total amount
    platformFee,
    sellerAmount,
  });

  res.json({
    razorpayOrderId: razorpayOrder.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: "INR",
    orderId: order._id,
  });
};


export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "paid",
    }).populate("productId", "title price thumbnailUrl fileUrl");

    console.log(`==> User ${req.user.id} has ${orders.length} paid orders`);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Debug endpoint - shows ALL orders with their statuses
export const getAllMyOrders = async (req, res) => {
  try {
    const allOrders = await Order.find({
      buyerId: req.user.id,
    }).populate("productId", "title price").sort({ createdAt: -1 });

    const statusCounts = {
      created: allOrders.filter(o => o.status === 'created').length,
      paid: allOrders.filter(o => o.status === 'paid').length,
      failed: allOrders.filter(o => o.status === 'failed').length,
    };

    console.log(`==> DEBUG: User ${req.user.id} order status:`, statusCounts);
    
    res.json({
      orders: allOrders,
      statusCounts,
      webhookIssue: statusCounts.created > 0 && statusCounts.paid === 0,
      message: statusCounts.created > 0 && statusCounts.paid === 0 
        ? "⚠️ Orders stuck in 'created' status - webhook not working!" 
        : "✅ All orders processed correctly"
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
