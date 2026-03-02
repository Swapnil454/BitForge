

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { applyWatermark } from "../utils/watermark.js";

// Download endpoint - proxy download through server for secure access
export const downloadProduct = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 1️⃣ Find order
    const order = await Order.findById(orderId).populate("buyerId", "name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2️⃣ Check buyer ownership
    if (order.buyerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 3️⃣ Check payment status
    if (order.status !== "paid") {
      return res.status(403).json({ message: "Payment not completed" });
    }

    // 4️⃣ Check download limit
    const downloadLimit = order.downloadLimit || 5;
    const downloadCount = order.downloadCount || 0;
    
    if (downloadCount >= downloadLimit) {
      return res.status(403).json({ 
        message: `Download limit reached (${downloadLimit} downloads). Contact support for assistance.`,
        downloadCount,
        downloadLimit
      });
    }

    // 5️⃣ Get product
    const product = await Product.findById(order.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 6️⃣ Validate file exists
    if (!product.fileKey) {
      return res.status(400).json({ message: "Download not available for this product" });
    }

    // 7️⃣ Construct safe filename using product title
    let filename = "download.pdf";
    if (product.title) {
      const safeName = product.title
        .replace(/[<>:"\/\\|?*]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      
      filename = safeName.toLowerCase().endsWith(".pdf") 
        ? safeName 
        : `${safeName}.pdf`;
    }
    
    console.log(`📥 Download filename will be: "${filename}"`);
    console.log(`📊 Download count: ${downloadCount + 1}/${downloadLimit}`);

    console.log(`📥 Streaming download for order: ${orderId}`);
    console.log(`   File Key: ${product.fileKey}`);
    console.log(`   Product: ${product.title}`);

    // 8️⃣ Try to get the resource - handle both authenticated and upload types
    let downloadUrl;
    
    try {
      console.log(`🔍 Trying to find as authenticated resource...`);
      await cloudinary.api.resource(product.fileKey, {
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
        await cloudinary.api.resource(product.fileKey, {
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
    
    // 9️⃣ Fetch from Cloudinary
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cloudinary fetch failed: ${response.status} - ${response.statusText}`);
      console.error(`   Error body: ${errorText.substring(0, 200)}`);
      throw new Error(`Cloudinary returned ${response.status}: ${response.statusText}`);
    }

    // 🔟 Get original file buffer
    let fileBuffer = Buffer.from(await response.arrayBuffer());
    
    // 1️⃣1️⃣ Apply watermark with buyer info
    const buyerInfo = {
      buyerName: order.buyerId.name || "Unknown",
      buyerEmail: order.buyerId.email || "Unknown",
      orderId: order._id.toString(),
      purchaseDate: new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      productName: product.title || "Digital Product"
    };
    
    console.log(`🔐 Applying watermark for: ${buyerInfo.buyerEmail}`);
    const { buffer: watermarkedBuffer, filename: finalFilename } = await applyWatermark(
      fileBuffer,
      filename,
      buyerInfo
    );
    
    // 1️⃣2️⃣ Track download
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    
    await Order.findByIdAndUpdate(orderId, {
      $inc: { downloadCount: 1 },
      $set: { lastDownloadAt: new Date() },
      $push: {
        downloadHistory: {
          downloadedAt: new Date(),
          ipAddress,
          userAgent: userAgent.substring(0, 200) // Limit length
        }
      }
    });
    
    console.log(`📊 Download tracked: ${downloadCount + 1}/${downloadLimit}`);

    // 1️⃣3️⃣ Set download headers
    const contentType = finalFilename.toLowerCase().endsWith(".zip") 
      ? "application/zip" 
      : "application/pdf";
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('X-Download-Count', downloadCount + 1);
    res.setHeader('X-Download-Limit', downloadLimit);
    
    console.log(`📤 Sending watermarked file: "${finalFilename}"`);
    
    // 1️⃣4️⃣ Send watermarked file
    res.send(watermarkedBuffer);

    console.log(`✅ Download completed for: ${finalFilename} (watermarked)`);

  } catch (error) {
    console.error("❌ Download error:", error);
    return res.status(500).json({ 
      message: "Failed to download file",
      error: error.message 
    });
  }
};

// Get download info for an order (remaining downloads, history)
export const getDownloadInfo = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const order = await Order.findById(orderId).select(
      "downloadCount downloadLimit lastDownloadAt downloadHistory buyerId"
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json({
      downloadCount: order.downloadCount || 0,
      downloadLimit: order.downloadLimit || 5,
      remainingDownloads: (order.downloadLimit || 5) - (order.downloadCount || 0),
      lastDownloadAt: order.lastDownloadAt,
      downloadHistory: order.downloadHistory || []
    });
  } catch (error) {
    console.error("Error getting download info:", error);
    res.status(500).json({ message: "Failed to get download info" });
  }
};
