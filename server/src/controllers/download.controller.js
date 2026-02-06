

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { generateSignedUrl } from "../utils/cloudinarySignedUrl.js";

export const downloadProduct = async (req, res) => {
  const { orderId } = req.params;

  // 1️⃣ Find order
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // 2️⃣ Check buyer ownership
  if (order.buyerId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  // 3️⃣ Check payment status
  if (order.status !== "paid") {
    return res.status(403).json({ message: "Payment not completed" });
  }

  // 4️⃣ Get product
  const product = await Product.findById(order.productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // 5️⃣ Generate signed URL
  const signedUrl = generateSignedUrl(product.fileKey);

  res.json({
    downloadUrl: signedUrl,
    expiresIn: "5 minutes",
  });
};
