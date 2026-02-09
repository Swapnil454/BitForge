

import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Simple download metadata endpoint used by buyer purchases page
// Returns the direct Cloudinary fileUrl plus a safe filename based on product title
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

  // 5️⃣ Use stored Cloudinary secure_url and construct a safe filename
  const baseName = product.title
    ? product.title.replace(/[^a-z0-9_\-]/gi, "_")
    : "download";
  const filename = baseName.toLowerCase().endsWith(".pdf")
    ? baseName
    : `${baseName}.pdf`;

  const downloadUrl = product.fileUrl;

  if (!downloadUrl) {
    return res.status(400).json({ message: "Download URL not configured for this product" });
  }

  res.json({
    downloadUrl,
    filename,
    productTitle: product.title,
  });
};
