


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
  const orders = await Order.find({
    buyerId: req.user.id,
    status: "paid",
  }).populate("productId", "title price");

  res.json(orders);
};
