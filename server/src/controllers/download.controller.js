import Order from "../models/Order.js";
import Product from "../models/Product.js";
import DownloadLog from "../models/DownloadLog.js";
import cloudinary from "../config/cloudinary.js";
import { applyWatermark } from "../utils/watermark.js";
import { getR2SignedDownloadUrl, fetchR2FileToBuffer } from "../utils/r2Download.js";

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

    const downloadLimit = order.downloadLimit || 5;
    const downloadCount = order.downloadCount || 0;

    if (downloadCount >= downloadLimit) {
      return res.status(403).json({
        message: `Download limit reached (${downloadLimit} downloads). Contact support for assistance.`,
        downloadCount,
        downloadLimit
      });
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

    // 6️⃣ Construct safe filename using product title and original extension
    let extension = ".pdf";
    if (product.fileName) {
      const parts = product.fileName.split('.');
      if (parts.length > 1) {
        extension = '.' + parts[parts.length - 1];
      }
    } else if (product.fileKey) {
      const parts = product.fileKey.split('.');
      if (parts.length > 1) {
        extension = '.' + parts[parts.length - 1];
      }
    } else if (product.format && product.format !== "Other") {
      extension = '.' + product.format.toLowerCase();
    }

    let filename = `download${extension}`;
    if (product.title) {
      const safeName = product.title
        .replace(/[<>:"\/\\|?*]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      filename = safeName.toLowerCase().endsWith(extension.toLowerCase())
        ? safeName
        : `${safeName}${extension}`;
    }

    console.log(`📥 Download filename will be: "${filename}"`);
    console.log(` Download count: ${downloadCount + 1}/${downloadLimit}`);
    console.log(`📥 Streaming download for order: ${orderId}`);

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    
    let downloadUrl;
    const timestamp = Math.floor(Date.now() / 1000);
    let signedUrlExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Determine which key to download: watermarked version (preferred) or original
    const targetKey = order.watermarkedR2Key ? order.watermarkedR2Key : product.fileKey;

    // Determine if the original file is legacy Cloudinary
    const isLegacyCloudinary = product.fileUrl && product.fileUrl.includes("cloudinary");

    // We use R2 if a watermarked file exists, OR if the original product is NOT legacy Cloudinary
    if (order.watermarkedR2Key || !isLegacyCloudinary) {
      downloadUrl = await getR2SignedDownloadUrl(targetKey, filename);
    } else {
      // Legacy Cloudinary Private URL
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
    }

    // Track download log
    await DownloadLog.create({
      userId: req.user.id,
      orderId: order._id,
      productId: product._id,
      productFileName: filename,
      storageProvider: order.watermarkedR2Key ? "r2" : (isLegacyCloudinary ? "cloudinary" : "r2"),
      ipAddress,
      userAgent,
      downloadType: order.watermarkedR2Key ? "watermarked" : "signed-url",
      buyerName: order.buyerId.name || "Unknown",
      buyerEmail: order.buyerId.email || "Unknown",
      signedUrlExpiresAt
    });

    // Track order history
    await Order.findByIdAndUpdate(orderId, {
      $inc: { downloadCount: 1 },
      $set: { lastDownloadAt: new Date() },
      $push: {
        downloadHistory: { downloadedAt: new Date(), ipAddress, userAgent: userAgent.substring(0, 200) }
      }
    });

    console.log(`📤 Redirecting to signed URL for: "${filename}"`);
    return res.json({ mode: "redirect", downloadUrl, filename });

  } catch (error) {
    console.error(" Download error:", error);
    
    // Attempt to log failure if order/product variables exist
    try {
        if (req.user && orderId) {
            await DownloadLog.create({
                userId: req.user.id,
                orderId: orderId,
                productId: null, 
                storageProvider: "unknown",
                ipAddress: req.ip || "unknown",
                userAgent: req.headers["user-agent"] || "unknown",
                downloadType: "failed", 
                status: "failed"
            });
        }
    } catch(logErr) {
        console.error("Failed to write DownloadLog on error:", logErr);
    }

    return res.status(500).json({
      message: "Failed to generate download link",
      error: error.message
    });
  }
};

// Get download info for an order
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
