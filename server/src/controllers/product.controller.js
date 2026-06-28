import mongoose from "mongoose";
import { generateSlug, generateUniqueSlug } from "../utils/slug.js";
import cloudinary from "../config/cloudinary.js";
import { uploadToR2, deleteFromR2, getPresignedUploadUrl } from "../utils/r2Upload.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET_NAME } from "../config/r2.js";
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import PromotionRequest from "../models/PromotionRequest.js";
import { createNotification } from "./notification.controller.js";
import {
  generatePreviewPages,
  extractFileMetadata,
  performBasicFileCheck
} from "../utils/previewGenerator.js";
import { scanFileWithVirusTotal } from "../utils/virusTotalScanner.js";
import { autoReviewContent } from "../utils/contentReview.js";
import {
  generateAutomaticPreviewPDF,
  generatePreviewPageImages,
  validatePDF
} from "../utils/pdfPreviewGenerator.js";

// Helper function to handle approved product updates
const handleApprovedProductUpdate = async (product, req, res, updateData) => {
  try {
    const {
      title,
      description,
      category,
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
    let previewPdfKey = product.previewPdfKey;
    let previewPdfUrl = product.previewPdfUrl;
    let previewPages = product.previewPages;
    let actualPageCount = product.pageCount;

    let fileType = product.fileType;
    let fileName = product.fileName;
    let storageProvider = product.storageProvider;

    // Handle file upload if provided
    if (req.files && req.files.file && req.files.file[0]) {
      try {
        const file = req.files.file[0];

        // Extract new file metadata
        const metadata = await extractFileMetadata(file.buffer, file.mimetype);
        fileSizeBytes = metadata.fileSizeBytes;
        actualPageCount = metadata.pageCount || actualPageCount;

        // Upload file to Cloudflare R2
        console.log("Uploading update to R2:", file.originalname);
        const uploadResult = await uploadToR2(file, product._id.toString());
        console.log("R2 upload successful:", uploadResult.fileKey);

        fileKey = uploadResult.fileKey;
        fileUrl = ""; // No direct public url for R2
        fileName = uploadResult.fileName;
        fileType = uploadResult.fileType;
        storageProvider = uploadResult.storageProvider;

        // 🚀 AUTOMATIC PREVIEW GENERATION
        if (file.mimetype.includes('pdf')) {
          try {
            console.log("📄 PDF updated - regenerating preview...");

            const previewResult = await generateAutomaticPreviewPDF(
              file.buffer,
              fileKey
            );

            previewPdfKey = previewResult.previewPdfKey;
            previewPdfUrl = previewResult.previewPdfUrl;
            actualPageCount = previewResult.totalPages;

            previewPages = [];

            console.log(" Preview regenerated for approved product update");
          } catch (err) {
            console.error(" Preview generation failed:", err);
          }
        }
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
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

    // Handle preview PDF - now automatic, kept for backward compatibility
    if (req.files && req.files.previewPdf && req.files.previewPdf[0]) {
      console.log(" Manual preview PDF upload detected (deprecated)");
    }

    // Create pending change request with new fields
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        changeRequest: "pending_update",
        pendingChanges: {
          title: title?.trim() || product.title,
          description: description?.trim() || product.description,
          category: category || product.category,
          price: price ? Number(price) : product.price,
          discount: discount !== undefined ? Number(discount) : product.discount,
          fileKey,
          fileName,
          fileSize: fileSizeBytes,
          fileType,
          storageProvider,
          fileUrl,
          thumbnailKey,
          thumbnailUrl,
          previewPdfKey,
          previewPdfUrl,
          previewPages,
          pageCount: pageCount ? Number(pageCount) : actualPageCount,
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
        "Product",
        {
          actionUrl: "/dashboard/admin/products",
          pushWhenInactiveOnly: false
        }
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
  try {
    const user = await User.findById(req.user.id);
    const isApproved = user.approvalStatus === "approved" || user.isApproved;

    if (!isApproved) {
      const productCount = await Product.countDocuments({ sellerId: req.user.id });
      if (productCount >= 2) {
        return res.status(403).json({ message: "Unverified sellers can only upload up to 2 products. Please verify your identity." });
      }
    }

    const baseSlug = generateSlug(req.body.title || "untitled");
    const slug = await generateUniqueSlug(Product, baseSlug);
    const categorySlug = generateSlug(req.body.category || "software");

    const product = await Product.create({
      ...req.body,
      sellerId: req.user.id,
      slug,
      categorySlug,
    });
    res.json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "all").trim();
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice =
      req.query.maxPrice !== undefined && req.query.maxPrice !== ""
        ? Number(req.query.maxPrice)
        : null;

    const matchesFilters = (product) => {
      const title = String(product.title || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();
      const finalPrice =
        product.discount > 0
          ? Math.max(product.price - (product.price * product.discount) / 100, 0)
          : product.price;

      if (search && !title.includes(search) && !description.includes(search)) {
        return false;
      }

      if (category !== "all" && String(product.category || "") !== category) {
        return false;
      }

      if (!Number.isNaN(minPrice) && finalPrice < minPrice) {
        return false;
      }

      if (maxPrice !== null && !Number.isNaN(maxPrice) && finalPrice > maxPrice) {
        return false;
      }

      return true;
    };

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 8;
      const skip = (page - 1) * limit;

      const products = await Product.find({ sellerId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

      const productsWithStats = await Promise.all(products.map(async (p) => {
         const reviews = await Review.find({ productId: p._id }, 'rating').lean();
         const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
         const buyers = await Order.countDocuments({ productId: p._id, status: 'paid' });

         const activePromotion = await PromotionRequest.findOne({
           productId: p._id,
           status: { $nin: ["REJECTED", "EXPIRED", "CANCELLED"] }
         }).lean();

         return {
           ...p,
           rating: parseFloat(avgRating.toFixed(1)),
           buyers: buyers,
           hasActivePromotion: !!activePromotion
          };
      }));
      const filteredProducts = productsWithStats.filter(matchesFilters);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      return res.json({
        products: paginatedProducts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalProducts: total
      });
    } else {
      const products = await Product.find({ sellerId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();
      
      const productsWithStats = await Promise.all(products.map(async (p) => {
         const reviews = await Review.find({ productId: p._id }, 'rating').lean();
         const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
         const buyers = await Order.countDocuments({ productId: p._id, status: 'paid' });

         const activePromotion = await PromotionRequest.findOne({
           productId: p._id,
           status: { $nin: ["REJECTED", "EXPIRED", "CANCELLED"] }
         }).lean();

         return {
           ...p,
           rating: parseFloat(avgRating.toFixed(1)),
           buyers: buyers,
           hasActivePromotion: !!activePromotion
          };
      }));

      res.json(productsWithStats.filter(matchesFilters));
    }
  } catch (error) {
    console.error("Get seller products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const uploadProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
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

    // Generate product ID beforehand for R2 path structuring
    const productId = new mongoose.Types.ObjectId();

    // Upload file to Cloudflare R2
    console.log("Uploading file to R2:", file.originalname);
    const fileUploadResult = await uploadToR2(file, productId.toString());
    console.log("R2 upload successful:", fileUploadResult.fileKey);

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

    // 🚀 AUTOMATIC PREVIEW GENERATION (Industry Standard)
    // Seller uploads ONLY ONE FILE → System automatically generates preview
    let previewPdfUploadResult = null;
    let previewPages = [];
    let actualPageCount = metadata.pageCount || 1;

    // Check if file is PDF and automatically generate preview
    if (file.mimetype.includes('pdf')) {
      try {
        console.log("📄 PDF detected - starting automatic preview generation...");

        // Validate PDF format
        validatePDF(file.buffer, file.mimetype);

        // Generate watermarked preview PDF automatically
        const previewResult = await generateAutomaticPreviewPDF(
          file.buffer,
          fileUploadResult.fileKey
        );

        console.log(" Preview generated:", {
          totalPages: previewResult.totalPages,
          previewPages: previewResult.previewPages,
          lockedPages: previewResult.lockedPages
        });

        // Store preview PDF info
        previewPdfUploadResult = {
          public_id: previewResult.previewPdfKey,
          secure_url: previewResult.previewPdfUrl
        };

        // Update actual page count from analysis
        actualPageCount = previewResult.totalPages;

        // Note: Preview page images are disabled for now
        // The preview PDF download is the primary feature
        previewPages = [];

        console.log(" Preview PDF ready for download");
      } catch (previewError) {
        console.error(" Preview generation failed:", previewError);
        // Don't block product upload if preview fails - continue without preview
        console.log(" Continuing without preview...");
      }
    } else {
      // For non-PDF files, use legacy preview generation
      console.log("📄 Non-PDF file - using legacy preview generation...");
      try {
         previewPages = await generatePreviewPages(
           "", // No secure url for R2
           fileUploadResult.fileKey,
           file.buffer,
           3
         );
      } catch(err) {
         console.log("Legacy preview failed, continuing", err.message);
      }
    }

    // Auto-review content based on heuristics
    const reviewResult = autoReviewContent({
      title: title,
      pageCount: pageCount || metadata.pageCount,
      fileSizeBytes: metadata.fileSizeBytes,
      price: Number(price),
      description: description
    });

    const baseSlug = generateSlug(title || "untitled");
    const slug = await generateUniqueSlug(Product, baseSlug);
    const categorySlug = generateSlug(category || "software");

    // Create product with all trust & validation fields
    const product = await Product.create({
      _id: productId, // Use the pre-generated ID
      sellerId: req.user.id,
      slug,
      categorySlug,
      title: title.trim(),
      description: description.trim(),
      category: category || "Software",
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      fileKey: fileUploadResult.fileKey,
      fileName: fileUploadResult.fileName,
      fileSize: fileUploadResult.fileSize,
      fileType: fileUploadResult.fileType,
      storageProvider: fileUploadResult.storageProvider,
      fileUrl: "", // R2 doesn't have a direct public URL
      thumbnailKey: thumbnailUploadResult?.public_id || null,
      thumbnailUrl: thumbnailUploadResult?.secure_url || null,
      previewPdfKey: previewPdfUploadResult?.public_id || null,
      previewPdfUrl: previewPdfUploadResult?.secure_url || null,

      // B. Structured validation fields
      pageCount: pageCount ? Number(pageCount) : actualPageCount,
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
      requiresManualReview: reviewResult.requiresManualReview ?? false,
      reviewSeverity: reviewResult.severity ?? null,
      reviewFlags: reviewResult.flags ?? [],
      reviewScore: reviewResult.score ?? null,
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
        "Product",
        {
          actionUrl: "/dashboard/admin/products",
          pushWhenInactiveOnly: false
        }
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
      category,
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
        category,
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
    let previewPdfKey = product.previewPdfKey;
    let previewPdfUrl = product.previewPdfUrl;
    let previewPages = product.previewPages;
    let actualPageCount = product.pageCount;

    let fileType = product.fileType;
    let fileName = product.fileName;
    let storageProvider = product.storageProvider;

    if (req.files && req.files.file && req.files.file[0]) {
      try {
        const file = req.files.file[0];

        // Extract metadata from new file
        const metadata = await extractFileMetadata(file.buffer, file.mimetype);
        fileSizeBytes = metadata.fileSizeBytes;
        actualPageCount = metadata.pageCount || actualPageCount;

        // Delete old file from Cloudinary if exists and it was a Cloudinary file
        if (product.fileKey && product.storageProvider !== "r2") {
          try {
            await cloudinary.uploader.destroy(product.fileKey, {
              resource_type: "raw",
              type: "authenticated"  // Must match upload type
            });
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
            // Continue with upload even if deletion fails
          }
        }
        // Note: we might want to delete from R2 if it was R2, but for now we'll just upload new

        // Upload new file to Cloudflare R2
        console.log("Uploading update to R2:", file.originalname);
        const uploadResult = await uploadToR2(file, productId);
        console.log("R2 upload successful:", uploadResult.fileKey);

        fileKey = uploadResult.fileKey;
        fileUrl = ""; // No direct public url for R2
        fileName = uploadResult.fileName;
        fileType = uploadResult.fileType;
        storageProvider = uploadResult.storageProvider;

        // 🚀 AUTOMATIC PREVIEW GENERATION for new file
        // Delete old preview if exists
        if (product.previewPdfKey) {
          try {
            await cloudinary.uploader.destroy(product.previewPdfKey, { resource_type: "image" });
          } catch (err) {
            console.error("Preview delete error:", err);
          }
        }

        // Generate new preview if PDF
        if (file.mimetype.includes('pdf')) {
          try {
            console.log("📄 PDF updated - regenerating preview...");

            const previewResult = await generateAutomaticPreviewPDF(
              file.buffer,
              fileKey
            );

            previewPdfKey = previewResult.previewPdfKey;
            previewPdfUrl = previewResult.previewPdfUrl;
            actualPageCount = previewResult.totalPages;

            previewPages = [];

            console.log(" Preview regenerated successfully");
          } catch (err) {
            console.error(" Preview generation failed:", err);
          }
        }
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
    // NOTE: This is now handled automatically in file upload section above
    // Keeping this section for backward compatibility with old manual uploads
    if (req.files && req.files.previewPdf && req.files.previewPdf[0]) {
      console.log(" Manual preview PDF upload detected (deprecated - use automatic generation)");
      // Manual preview upload is deprecated but still supported for legacy
    }

    // Auto-review content based on heuristics for updates
    const reviewResult = autoReviewContent({
      title: title?.trim() || product.title,
      pageCount: pageCount ? Number(pageCount) : actualPageCount,
      fileSizeBytes: fileSizeBytes,
      price: price ? Number(price) : product.price,
      description: description?.trim() || product.description
    });

    const updateData = {
      title: title?.trim(),
      description: description?.trim(),
      category: category !== undefined ? category : undefined,
      price: price ? Number(price) : undefined,
      discount: discount !== undefined ? Number(discount) : undefined,
      fileKey: fileKey,
      fileName: fileName,
      fileSize: fileSizeBytes,
      fileType: fileType,
      storageProvider: storageProvider,
      fileUrl: fileUrl,
      fileSizeBytes: fileSizeBytes,
      pageCount: pageCount ? Number(pageCount) : actualPageCount,
      language: language,
      format: format,
      intendedAudience: intendedAudience,
      lastUpdatedAt: new Date(),
      previewPdfKey: previewPdfKey,
      previewPdfUrl: previewPdfUrl,
      previewPages: previewPages,
      contentReviewed: reviewResult.status,
      contentReviewDate: reviewResult.status === "auto-reviewed" ? new Date() : null,
      requiresManualReview: reviewResult.requiresManualReview ?? false,
      reviewSeverity: reviewResult.severity ?? null,
      reviewFlags: reviewResult.flags ?? [],
      reviewScore: reviewResult.score ?? null,
    };

    if (deleteThumbnail === "true") {
      updateData.thumbnailKey = null;
      updateData.thumbnailUrl = null;
    } else {
      updateData.thumbnailKey = thumbnailKey;
      updateData.thumbnailUrl = thumbnailUrl;
    }

    if (product.status === "rejected" || product.status === "changes_requested") {
      updateData.status = "pending";
      updateData.rejectionReason = null;
    }

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
          "Product",
          {
            actionUrl: "/dashboard/admin/products",
            pushWhenInactiveOnly: false
          }
        );
      }

      return res.status(202).json({
        message: "Deletion submitted for admin approval",
        changeRequest: "pending_deletion",
      });
    }

    // Delete main file from appropriate storage if exists
    if (product.fileKey) {
      try {
        if (product.storageProvider === "r2") {
          await deleteFromR2(product.fileKey);
        } else {
          // Fallback for older products still on Cloudinary
          await cloudinary.uploader.destroy(product.fileKey, {
            resource_type: "raw",
            type: "authenticated"  // Must match upload type
          });
        }
      } catch (storageError) {
        console.error("Storage file delete error:", storageError);
        // Continue with product deletion even if file deletion fails
      }
    }

    // Delete thumbnail from Cloudinary if exists
    if (product.thumbnailKey) {
      try {
        await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
      } catch (cloudinaryError) {
        console.error("Thumbnail delete error:", cloudinaryError);
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(productId);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* ─────────────────────────────────────────────────────────
   DIRECT-TO-CLOUD UPLOAD FLOW
───────────────────────────────────────────────────────── */

export const generateUploadPresignedUrl = async (req, res) => {
  try {
    const { fileName, contentType, productId } = req.body;

    // Validate file type server-side
    const allowed = [
      "application/pdf", 
      "application/zip", 
      "application/x-zip-compressed",
      "image/jpeg", 
      "image/png", 
      "image/webp"
    ];
    
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ message: "File type not allowed" });
    }

    const safeFilename = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const r2Key = `products/${productId}/${Date.now()}-${uuidv4()}-${safeFilename}`;

    const uploadUrl = await getPresignedUploadUrl(r2Key, contentType);

    res.json({ uploadUrl, r2Key });
  } catch (err) {
    console.error("Presign error:", err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};

export const confirmProductUpload = async (req, res) => {
  try {
    const {
      productId,
      r2Key,
      fileName,
      fileType,
      fileSize,
      title,
      description,
      category,
      price,
      discount,
      pageCount,
      language,
      format,
      intendedAudience,
      thumbnailBase64
    } = req.body;

    let thumbnailUrl = "";
    let thumbnailKey = "";

    if (thumbnailBase64) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(thumbnailBase64, {
          folder: "contentSellify/thumbnails",
        });
        thumbnailUrl = uploadResponse.secure_url;
        thumbnailKey = uploadResponse.public_id;
      } catch (err) {
        console.error("Custom thumbnail upload failed:", err);
      }
    }

    // Generate valid slug to prevent MongoDB E11000 duplicate key error
    const safeTitle = title ? String(title).trim() : "Untitled";
    const baseSlug = generateSlug(safeTitle);
    const finalSlug = await generateUniqueSlug(Product, baseSlug);
    const finalCategory = category || "Software";
    const safeDesc = description ? String(description).trim() : "";

    // Save to DB with "processing" status immediately
    const product = await Product.create({
      _id: productId, // Use the ID passed from frontend
      sellerId: req.user.id,
      title: safeTitle,
      description: safeDesc,
      category: finalCategory,
      categorySlug: generateSlug(finalCategory),
      slug: finalSlug,
      price: price ? Number(price) : 0,
      discount: discount ? Number(discount) : 0,
      fileKey: r2Key,
      fileName: fileName,
      fileSize: fileSize || 0,
      fileSizeBytes: fileSize || 0,
      fileType: fileType,
      storageProvider: "r2",
      fileUrl: "",
      pageCount: Number(pageCount) || 1,
      language: language || "English",
      format: format || "PDF",
      intendedAudience: intendedAudience || "All Levels",
      status: "processing", // Crucial: Will be updated by background process
      thumbnailUrl: thumbnailUrl,
      thumbnailKey: thumbnailKey,
    });

    // Return instantly — Background processing starts locally
    res.status(202).json({ 
      message: "Upload confirmed, background processing started",
      product 
    });

    // Trigger processing immediately in background (for local development or if worker fails)
    processProductBackground(r2Key, thumbnailUrl, "").catch(err => console.error("Local background processing failed:", err));

  } catch (err) {
    console.error("Confirm upload error:", err);
    res.status(500).json({ message: "Failed to confirm upload" });
  }
};

export const processProductBackground = async (r2Key, thumbnailUrl, previewUrl) => {
  try {
    const product = await Product.findOne({ fileKey: r2Key, status: "processing" });
    if (!product) return;

    console.log(`[Background Processing] Started for ${r2Key}`);

    let scanResult = { scanned: true, clean: true };

    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
      });
      const { Body } = await r2Client.send(command);
      
      const fileByteArray = await Body.transformToByteArray();
      const fileBuffer = Buffer.from(fileByteArray);
      
      console.log("Starting VirusTotal scan in background...");
      scanResult = await scanFileWithVirusTotal(fileBuffer, product.fileName);
    } catch (scanErr) {
      console.error("Failed to fetch/scan file from R2:", scanErr);
    }

    const reviewResult = autoReviewContent({
      title: product.title,
      pageCount: product.pageCount,
      fileSizeBytes: product.fileSize,
      price: product.price,
      description: product.description
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      { 
        status: scanResult.clean ? "pending" : "rejected",
        rejectionReason: scanResult.clean ? null : scanResult.reason,
        thumbnailUrl: thumbnailUrl || product.thumbnailUrl,
        previewPdfUrl: previewUrl || product.previewPdfUrl,
        contentReviewed: reviewResult.status,
        contentReviewDate: new Date(),
        requiresManualReview: reviewResult.requiresManualReview ?? false,
        reviewSeverity: reviewResult.severity ?? null,
        reviewFlags: reviewResult.flags ?? [],
        reviewScore: reviewResult.score ?? null,
        malwareScanned: scanResult.scanned,
        malwareScanDate: scanResult.scanDate || new Date(),
        virusTotalId: scanResult.virusTotalId || null,
        virusTotalLink: scanResult.scanLink || null,
        malwareScanDetails: {
          detections: scanResult.detections || {},
          basicCheckOnly: scanResult.basicCheckOnly || false,
        },
      },
      { new: true }
    );

    // Notify the seller that processing is done
    await createNotification(
      product.sellerId,
      "product_processed",
      "File Processing Complete",
      `Your upload for "${product.title}" has been processed and is now pending admin review.`,
      product._id,
      "Product"
    );

    // Notify admins about new product pending review
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "product_pending_review",
        "New Product Pending Review",
        `A new product "${product.title}" is waiting for approval.`,
        product._id,
        "Product",
        { actionUrl: "/dashboard/admin/products" }
      );
    }
  } catch (err) {
    console.error("Background Processing Error:", err);
  }
};

export const handleWorkerUploadComplete = async (req, res) => {
  try {
    const { r2Key, thumbnailUrl, previewUrl } = req.body;
    
    // Use the extracted background processor function
    // Return early, let it run in the background if we don't want to block, but worker is fine with waiting
    await processProductBackground(r2Key, thumbnailUrl, previewUrl);
    
    res.json({ ok: true });
  } catch (err) {
    console.error("Worker Webhook Error:", err);
    res.status(500).json({ error: "Internal server error" });
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
