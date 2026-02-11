

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { generateSignedUrl } from "../utils/cloudinarySignedUrl.js";

// Download endpoint with signed URL generation for secure access
// Returns a time-limited signed URL for purchased products
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

  // 5️⃣ Construct safe filename
  const baseName = product.title
    ? product.title.replace(/[^a-z0-9_\-]/gi, "_")
    : "download";
  const filename = baseName.toLowerCase().endsWith(".pdf")
    ? baseName
    : `${baseName}.pdf`;

  // 6️⃣ Generate signed URL (secure, time-limited access)
  if (!product.fileKey) {
    return res.status(400).json({ message: "Download not available for this product" });
  }

  try {
    const signedUrl = generateSignedUrl(product.fileKey, filename);
    
    res.json({
      downloadUrl: signedUrl,
      filename,
      productTitle: product.title,
      expiresIn: "5 minutes", // URL expires after 5 minutes
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return res.status(500).json({ message: "Failed to generate download URL" });
  }
};
