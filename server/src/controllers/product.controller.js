
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";
import { 
  generatePreviewPages, 
  extractFileMetadata,
  performBasicFileCheck
} from "../utils/previewGenerator.js";
import { scanFileWithVirusTotal } from "../utils/virusTotalScanner.js";
import { autoReviewContent } from "../utils/contentReview.js";

// Helper function to handle approved product updates
const handleApprovedProductUpdate = async (product, req, res, updateData) => {
  try {
    const { 
      title, 
      description, 
      price, 
      discount, 
      deleteThumbnail,
      pageCount,
      language,
      format,
      intendedAudience
    } = updateData;
    let fileKey = product.fileKey;
    let fileUrl = product.fileUrl;
    let fileSizeBytes = product.fileSizeBytes;

    // Handle file upload if provided
    if (req.files && req.files.file && req.files.file[0]) {
      try {
        const file = req.files.file[0];
        
        // Extract new file metadata
        const metadata = await extractFileMetadata(file.buffer, file.mimetype);
        fileSizeBytes = metadata.fileSizeBytes;
        
        const uploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "sellify/products",
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(file.buffer);
        });

        fileKey = uploadResult.public_id;
        fileUrl = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("File upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new file" });
      }
    }

    // Handle thumbnail
    let thumbnailKey = product.thumbnailKey;
    let thumbnailUrl = product.thumbnailUrl;

    if (deleteThumbnail === "true" && product.thumbnailKey) {
      thumbnailKey = null;
      thumbnailUrl = null;
    }

    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      try {
        const thumbnailUploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "sellify/thumbnails",
              transformation: [{ width: 800, height: 600, crop: "limit" }],
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(req.files.thumbnail[0].buffer);
        });

        thumbnailKey = thumbnailUploadResult.public_id;
        thumbnailUrl = thumbnailUploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Thumbnail upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new thumbnail" });
      }
    }

    // Handle preview PDF
    let previewPdfKey = product.previewPdfKey;
    let previewPdfUrl = product.previewPdfUrl;

    if (req.files && req.files.previewPdf && req.files.previewPdf[0]) {
      try {
        const previewPdfUploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "sellify/previews",
              access_mode: "public",
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(req.files.previewPdf[0].buffer);
        });

        previewPdfKey = previewPdfUploadResult.public_id;
        previewPdfUrl = previewPdfUploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Preview PDF upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new preview PDF" });
      }
    }

    // Create pending change request with new fields
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        changeRequest: "pending_update",
        pendingChanges: {
          title: title?.trim() || product.title,
          description: description?.trim() || product.description,
          price: price ? Number(price) : product.price,
          discount: discount !== undefined ? Number(discount) : product.discount,
          fileKey,
          fileUrl,
          thumbnailKey,
          thumbnailUrl,
          previewPdfKey,
          previewPdfUrl,
          pageCount: pageCount ? Number(pageCount) : product.pageCount,
          fileSizeBytes: fileSizeBytes,
          language: language || product.language,
          format: format || product.format,
          intendedAudience: intendedAudience || product.intendedAudience,
        },
      },
      { new: true }
    );

    // Notify all admins about product update request
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "product_update_requested",
        "Product Update Request",
        `${req.user.name} requested update for "${product.title}"`,
        product._id,
        "Product"
      );
    }

    res.status(202).json({
      message: "Update submitted for admin approval",
      changeRequest: "pending_update",
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to submit update request" });
  }
};

export const createProduct = async (req, res) => {
  const product = await Product.create({
    ...req.body,
    sellerId: req.user.id,
  });
  res.json(product);
};

export const getSellerProducts = async (req, res) => {
  const products = await Product.find({ sellerId: req.user.id });
  res.json(products);
};

export const uploadProduct = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price, 
      discount,
      pageCount,
      language,
      format,
      intendedAudience
    } = req.body;

    // Validation - Required fields
    if (!title || !description || !price) {
      return res.status(400).json({ message: "Title, description, and price are required" });
    }

    // Validate new required fields
    if (!language || !format || !intendedAudience) {
      return res.status(400).json({ 
        message: "Language, format, and intended audience are required" 
      });
    }

    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ message: "File is required" });
    }

    const file = req.files.file[0];
    const thumbnail = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const previewPdf = req.files.previewPdf ? req.files.previewPdf[0] : null;

    // Extract file metadata
    const metadata = await extractFileMetadata(file.buffer, file.mimetype);
    
    // Perform malware scan (VirusTotal or basic checks)
    console.log("Starting malware scan for:", file.originalname);
    const scanResult = await scanFileWithVirusTotal(file.buffer, file.originalname);
    console.log("Scan result:", scanResult);
    
    if (!scanResult.clean) {
      return res.status(400).json({ 
        message: "File failed security scan", 
        reason: scanResult.reason,
        details: scanResult.detections
      });
    }

    // Upload file to Cloudinary
    const fileUploadResult = await new Promise((resolve, reject) => {
      const result = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "sellify/products",
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      result.end(file.buffer);
    });

    // Upload thumbnail if provided
    let thumbnailUploadResult = null;
    if (thumbnail) {
      thumbnailUploadResult = await new Promise((resolve, reject) => {
        const result = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "sellify/thumbnails",
            transformation: [{ width: 800, height: 600, crop: "limit" }],
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );
        result.end(thumbnail.buffer);
      });
    }

    // Upload preview PDF if provided (public access)
    let previewPdfUploadResult = null;
    if (previewPdf) {
      previewPdfUploadResult = await new Promise((resolve, reject) => {
        const result = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "sellify/previews",
            access_mode: "public", // Make preview PDF publicly accessible
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );
        result.end(previewPdf.buffer);
      });
    }

    // Generate preview pages (watermarked, blurred) - pass file buffer
    console.log("Generating preview pages...");
    const previewPages = await generatePreviewPages(
      fileUploadResult.secure_url,
      fileUploadResult.public_id,
      file.buffer, // Pass buffer for real PDF extraction
      3 // Max 3 preview pages
    );
    console.log("Generated", previewPages.length, "preview pages");

    // Auto-review content based on heuristics
    const reviewResult = autoReviewContent({
      title: title,
      pageCount: pageCount || metadata.pageCount,
      fileSizeBytes: metadata.fileSizeBytes,
      price: Number(price),
      description: description
    });

    // Create product with all trust & validation fields
    const product = await Product.create({
      sellerId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      fileKey: fileUploadResult.public_id,
      fileUrl: fileUploadResult.secure_url,
      thumbnailKey: thumbnailUploadResult?.public_id || null,
      thumbnailUrl: thumbnailUploadResult?.secure_url || null,
      previewPdfKey: previewPdfUploadResult?.public_id || null,
      previewPdfUrl: previewPdfUploadResult?.secure_url || null,
      
      // B. Structured validation fields
      pageCount: pageCount ? Number(pageCount) : metadata.pageCount || 1,
      fileSizeBytes: metadata.fileSizeBytes,
      language: language,
      lastUpdatedAt: new Date(),
      format: format,
      intendedAudience: intendedAudience,
      
      // A. Preview pages
      previewPages: previewPages,
      
      // D. Trust checklist
      malwareScanned: scanResult.scanned,
      malwareScanDate: scanResult.scanDate,
      virusTotalId: scanResult.virusTotalId || null,
      virusTotalLink: scanResult.scanLink || null,
      malwareScanDetails: {
        detections: scanResult.detections || {},
        basicCheckOnly: scanResult.basicCheckOnly || false,
      },
      contentReviewed: reviewResult.status,
      contentReviewDate: reviewResult.status === "auto-reviewed" ? new Date() : null,
      refundEligible: true,
      
      status: "pending",
    });

    // Notify all admins about new product pending review
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "product_pending_review",
        "New Product Pending Review",
        `${req.user.name} uploaded "${product.title}" for approval`,
        product._id,
        "Product"
      );
    }

    res.status(201).json({
      message: "Product uploaded, waiting for approval",
      product,
      reviewFlags: reviewResult.flags,
      requiresManualReview: reviewResult.requiresManualReview
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Something went wrong during upload" });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      title, 
      description, 
      price, 
      discount, 
      deleteThumbnail,
      pageCount,
      language,
      format,
      intendedAudience
    } = req.body;

    // Validate product exists and belongs to seller
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: You can only edit your own products" });
    }

    // If product is approved, create a pending change request instead
    if (product.status === "approved") {
      return handleApprovedProductUpdate(product, req, res, { 
        title, 
        description, 
        price, 
        discount, 
        deleteThumbnail,
        pageCount,
        language,
        format,
        intendedAudience
      });
    }

    // Handle file upload if provided
    let fileKey = product.fileKey;
    let fileUrl = product.fileUrl;
    let fileSizeBytes = product.fileSizeBytes;

    if (req.files && req.files.file && req.files.file[0]) {
      try {
        const file = req.files.file[0];
        
        // Extract metadata from new file
        const metadata = await extractFileMetadata(file.buffer, file.mimetype);
        fileSizeBytes = metadata.fileSizeBytes;
        
        // Delete old file from Cloudinary if exists
        if (product.fileKey) {
          try {
            await cloudinary.uploader.destroy(product.fileKey, { resource_type: "raw" });
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Continue with upload even if deletion fails
          }
        }

        // Upload new file to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "sellify/products",
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(file.buffer);
        });

        fileKey = uploadResult.public_id;
        fileUrl = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("File upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new file" });
      }
    }

    // Handle thumbnail upload/delete
    let thumbnailKey = product.thumbnailKey;
    let thumbnailUrl = product.thumbnailUrl;

    // Delete thumbnail if requested
    if (deleteThumbnail === "true" && product.thumbnailKey) {
      try {
        await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
        thumbnailKey = null;
        thumbnailUrl = null;
      } catch (cloudinaryError) {
        console.error("Thumbnail delete error:", cloudinaryError);
      }
    }

    // Upload new thumbnail if provided
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      try {
        // Delete old thumbnail if exists
        if (product.thumbnailKey) {
          try {
            await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
          } catch (cloudinaryError) {
            console.error("Cloudinary thumbnail delete error:", cloudinaryError);
          }
        }

        // Upload new thumbnail
        const thumbnailUploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "sellify/thumbnails",
              transformation: [{ width: 800, height: 600, crop: "limit" }],
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(req.files.thumbnail[0].buffer);
        });

        thumbnailKey = thumbnailUploadResult.public_id;
        thumbnailUrl = thumbnailUploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Thumbnail upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new thumbnail" });
      }
    }

    // Handle preview PDF upload
    let previewPdfKey = product.previewPdfKey;
    let previewPdfUrl = product.previewPdfUrl;

    // Upload new preview PDF if provided
    if (req.files && req.files.previewPdf && req.files.previewPdf[0]) {
      try {
        // Delete old preview PDF if exists
        if (product.previewPdfKey) {
          try {
            await cloudinary.uploader.destroy(product.previewPdfKey, { resource_type: "raw" });
          } catch (cloudinaryError) {
            console.error("Cloudinary preview PDF delete error:", cloudinaryError);
          }
        }

        // Upload new preview PDF
        const previewPdfUploadResult = await new Promise((resolve, reject) => {
          const result = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "sellify/previews",
              access_mode: "public",
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );
          result.end(req.files.previewPdf[0].buffer);
        });

        previewPdfKey = previewPdfUploadResult.public_id;
        previewPdfUrl = previewPdfUploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Preview PDF upload error:", cloudinaryError);
        return res.status(500).json({ message: "Failed to upload new preview PDF" });
      }
    }

    // Update product - explicitly handle null values for thumbnail
    const updateData = {
      title: title?.trim(),
      description: description?.trim(),
      price: price ? Number(price) : undefined,
      discount: discount !== undefined ? Number(discount) : undefined,
      fileKey: fileKey,
      fileUrl: fileUrl,
      fileSizeBytes: fileSizeBytes,
      pageCount: pageCount ? Number(pageCount) : undefined,
      language: language,
      format: format,
      intendedAudience: intendedAudience,
      lastUpdatedAt: new Date(),
    };

    // Handle thumbnail - explicitly allow null
    if (deleteThumbnail === "true") {
      updateData.thumbnailKey = null;
      updateData.thumbnailUrl = null;
    } else {
      updateData.thumbnailKey = thumbnailKey;
      updateData.thumbnailUrl = thumbnailUrl;
    }

    // Add preview PDF URLs if updated
    updateData.previewPdfKey = previewPdfKey;
    updateData.previewPdfUrl = previewPdfUrl;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product exists and belongs to seller
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own products" });
    }

    // If product is approved, create a pending deletion request
    if (product.status === "approved") {
      await Product.findByIdAndUpdate(
        productId,
        { changeRequest: "pending_deletion" },
        { new: true }
      );

      // Notify all admins about product deletion request
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "product_deletion_requested",
          "Product Deletion Request",
          `${req.user.name} requested deletion for "${product.title}"`,
          product._id,
          "Product"
        );
      }

      return res.status(202).json({
        message: "Deletion submitted for admin approval",
        changeRequest: "pending_deletion",
      });
    }

    // Delete file from Cloudinary if exists
    if (product.fileKey) {
      try {
        await cloudinary.uploader.destroy(product.fileKey, { resource_type: "raw" });
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Continue with product deletion even if file deletion fails
      }
    }

    // Delete thumbnail from Cloudinary if exists
    if (product.thumbnailKey) {
      try {
        await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
      } catch (cloudinaryError) {
        console.error("Cloudinary thumbnail delete error:", cloudinaryError);
        // Continue with product deletion even if thumbnail deletion fails
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(productId);

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};