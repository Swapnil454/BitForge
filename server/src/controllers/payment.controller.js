


import razorpay from "../config/razorpay.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    return res.status(404).json({ message: "Product not found" });
  }

  const amount = product.price * 100; // paise
  const platformFee = product.price * 0.1;
  const sellerAmount = product.price - platformFee;

  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const order = await Order.create({
    buyerId: req.user.id,
    sellerId: product.sellerId,
    productId: product._id,
    razorpayOrderId: razorpayOrder.id,
    amount: product.price,
    platformFee,
    sellerAmount,
  });

  res.json({
    razorpayOrderId: razorpayOrder.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount,
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
