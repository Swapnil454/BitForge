

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

// Download endpoint - proxy download through server for secure access
export const downloadProduct = async (req, res) => {
  const { orderId } = req.params;

  try {
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

    // 5️⃣ Validate file exists
    if (!product.fileKey) {
      return res.status(400).json({ message: "Download not available for this product" });
    }

    // 6️⃣ Construct safe filename using product title
    let filename = "download.pdf";
    if (product.title) {
      // Replace unsafe characters but preserve spaces
      const safeName = product.title
        .replace(/[<>:"\/\\|?*]/g, "") // Remove truly unsafe characters
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
      
      // Ensure .pdf extension
      filename = safeName.toLowerCase().endsWith(".pdf") 
        ? safeName 
        : `${safeName}.pdf`;
    }
    
    console.log(`📥 Download filename will be: "${filename}"`);

    console.log(`📥 Streaming download for order: ${orderId}`);
    console.log(`   File Key: ${product.fileKey}`);
    console.log(`   Product: ${product.title}`);

    // 7️⃣ Try to get the resource - handle both authenticated and upload types
    let resourceInfo;
    let downloadUrl;
    
    try {
      // First, try as authenticated resource (new uploads)
      console.log(`🔍 Trying to find as authenticated resource...`);
      resourceInfo = await cloudinary.api.resource(product.fileKey, {
        resource_type: "raw",
        type: "authenticated",
      });
      console.log(`✅ Found as authenticated resource`);
      
      const timestamp = Math.floor(Date.now() / 1000);
      downloadUrl = cloudinary.utils.private_download_url(
        product.fileKey,
        "",
        {
          resource_type: "raw",
          type: "authenticated",
          expires_at: timestamp + 300,
          attachment: true,
        }
      );
    } catch (authError) {
      console.log(`⚠️ Not found as authenticated, trying as upload type...`);
      
      try {
        // Try as upload type (old uploads)
        resourceInfo = await cloudinary.api.resource(product.fileKey, {
          resource_type: "raw",
          type: "upload",
        });
        console.log(`✅ Found as upload resource`);
        
        const timestamp = Math.floor(Date.now() / 1000);
        downloadUrl = cloudinary.utils.private_download_url(
          product.fileKey,
          "",
          {
            resource_type: "raw",
            type: "upload",
            expires_at: timestamp + 300,
            attachment: true,
          }
        );
      } catch (uploadError) {
        console.error(`❌ Resource not found as authenticated or upload type`);
        throw new Error(`File not found in Cloudinary: ${product.fileKey}`);
      }
    }
    
    console.log(`🔐 Generated download URL: ${downloadUrl.substring(0, 80)}...`);
    
    // Fetch from Cloudinary
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cloudinary fetch failed: ${response.status} - ${response.statusText}`);
      console.error(`   Error body: ${errorText.substring(0, 200)}`);
      throw new Error(`Cloudinary returned ${response.status}: ${response.statusText}`);
    }

    // Set download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); // Allow frontend to read this header
    
    console.log(`📤 Sending file with header: Content-Disposition: attachment; filename="${filename}"`);
    
    // Stream the file to user
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

    console.log(`✅ Download completed for: ${filename}`);

  } catch (error) {
    console.error("❌ Download error:", error);
    return res.status(500).json({ 
      message: "Failed to download file",
      error: error.message 
    });
  }
};
