import User from "../models/User.js";
import Product from "../models/Product.js";
import Payout from "../models/Payout.js";
import cloudinary from "../config/cloudinary.js";
import { deleteFromR2 } from "../utils/r2Upload.js";
import { createNotification } from "./notification.controller.js";
// import razorpayX from "../config/razorpayx.js"; // Temporarily disabled for manual payouts
import Dispute from "../models/Dispute.js";
import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import PDFDocument from 'pdfkit';
import Review from "../models/Review.js";
import ModerationLog from "../models/ModerationLog.js";
import { sendApprovalEmail, sendRejectionEmail, sendChangesRequestedEmail, sendThreatNotificationEmail } from "../utils/moderationEmails.js";
import { scanFileWithVirusTotal } from "../utils/virusTotalScanner.js";
import mongoose from "mongoose";

// Utility to write moderation log non-blocking
function writeModerationLog(data) {
  ModerationLog.create(data).catch(err => {
    console.error('[ModerationLog] Failed to write log:', err.message, data);
  });
}

export const getPendingSellers = async (req, res) => {
  const sellers = await User.find({
    role: "seller",
    approvalStatus: "pending",
  }).select("-password");
  res.json(sellers);
};

export const approveSeller = async (req, res) => {
  const { id } = req.params;

  const seller = await User.findByIdAndUpdate(id, {
    isApproved: true,
    approvalStatus: "approved",
    approvalReason: null,
  }, { new: true });

  // Notify seller about approval
  if (seller) {
    await createNotification(
      seller._id,
      "seller_account_approved",
      'Seller Account Approved! 🎉',
      'Congratulations! Your seller account has been approved. You can now start listing and selling products on our platform.',
      seller._id,
      'User'
    );
  }

  res.json({ message: "Seller approved" });
};

export const rejectSeller = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const seller = await User.findByIdAndUpdate(id, {
    isApproved: false,
    approvalStatus: "rejected",
    approvalReason: reason,
  }, { new: true });

  // Notify seller about rejection
  if (seller) {
    await createNotification(
      seller._id,
      "seller_account_rejected",
      'Seller Account Not Approved',
      `Your seller account application was not approved. Reason: ${reason || 'Not specified'}`,
      seller._id,
      'User'
    );
  }

  res.json({ message: "Seller rejected" });
};

// Get all pending products
export const getPendingProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = 'pending',
      sort = 'newest'
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { status };
    if (category && category !== 'all') {
      matchStage.category = category;
    }

    const sortStage = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_high: { price: -1 },
      price_low:  { price:  1 },
    }[sort] ?? { createdAt: -1 };

    const searchStage = {};
    if (search) {
      searchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'seller.email': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const result = await Product.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      { $match: searchStage },
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                title: 1, description: 1, price: 1,
                discount: 1, category: 1,
                thumbnailUrl: 1, fileCount: 1, fileType: '$format',
                finalPrice: 1,
                uploadedAt: '$createdAt',
                createdAt: 1,
                status: 1,
                reviewSeverity: 1,
                reviewFlags: 1,
                'seller.name': 1,
                'seller.email': 1,
                'seller.emailVerified': '$seller.isVerified',
                'seller.status': '$seller.accountStatus',
                'seller.sellerStats': 1
              }
            }
          ]
        }
      }
    ]);

    const total = result[0].metadata[0]?.total || 0;
    const products = result[0].data;

    res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({ message: "Failed to fetch pending products" });
  }
};

// Get product moderation stats
export const getProductStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const statsResult = await Product.aggregate([
      {
        $facet: {
          pending: [
            { $match: { status: 'pending' } },
            { $count: 'count' }
          ],
          pendingChanges: [
            { $match: { status: 'changes_requested' } },
            { $count: 'count' }
          ],
          approvedToday: [
            { $match: {
              status: 'approved',
              updatedAt: { $gte: startOfDay, $lte: endOfDay }
            }},
            { $count: 'count' }
          ],
          rejectedToday: [
            { $match: {
              status: 'rejected',
              updatedAt: { $gte: startOfDay, $lte: endOfDay }
            }},
            { $count: 'count' }
          ]
        }
      }
    ]);

    const stats = statsResult[0];

    res.json({
      pending: stats.pending[0]?.count || 0,
      pendingChanges: stats.pendingChanges[0]?.count || 0,
      approvedToday: stats.approvedToday[0]?.count || 0,
      rejectedToday: stats.rejectedToday[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching product stats:", error);
    res.status(500).json({ message: "Failed to fetch product stats" });
  }
};

// Get all products with pagination and filtering
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all", category = "all", sortBy = "newest" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status !== "all") query.status = status;
    if (category !== "all") query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sort = {};
    if (sortBy === "newest") sort.createdAt = -1;
    else if (sortBy === "oldest") sort.createdAt = 1;
    else if (sortBy === "price_high") sort.price = -1;
    else if (sortBy === "price_low") sort.price = 1;

    const products = await Product.find(query)
      .populate("sellerId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const approvedCount = await Product.countDocuments({ status: "approved" });
    const pendingCount = await Product.countDocuments({ status: "pending" });
    const rejectedCount = await Product.countDocuments({ status: "rejected" });

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        total,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Get product details by ID (for admin view)
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate("sellerId", "name email phone _id");
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [orderStats, recentOrders, ratingStats] = await Promise.all([
      Order.aggregate([
        { $match: { productId: product._id, status: "paid" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
      Order.find({ productId: product._id, status: "paid" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("buyerId", "name email")
        .select("buyerId amount status createdAt")
        .lean(),
      Review.aggregate([
        { $match: { productId: product._id, isHidden: { $ne: true } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);

    const totalSales = orderStats[0]?.totalSales || 0;
    const totalRevenue = Number((orderStats[0]?.totalRevenue || 0).toFixed(2));
    const avgRating = ratingStats[0]?.avgRating ? Number(ratingStats[0].avgRating.toFixed(1)) : 0;

    const recentPurchases = recentOrders.map((order) => ({
      _id: order._id,
      buyerName: order.buyerId?.name || "Unknown Buyer",
      amount: order.amount || 0,
      status: order.status,
      createdAt: order.createdAt,
    }));

    const productData = product.toObject();

    res.json({
      ...productData,
      totalSales,
      totalRevenue,
      avgRating,
      totalViews: productData.totalViews ?? 0,
      recentPurchases,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
};

// Get advanced product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const days = range && range !== "all" ? Number(range) : null;
    const now = new Date();
    const startDate = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;

    const [totalProducts, approved, pending, rejected] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "approved" }),
      Product.countDocuments({ status: "pending" }),
      Product.countDocuments({ status: "rejected" }),
    ]);

    // Category breakdown
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const submissionsQuery = startDate ? { createdAt: { $gte: startDate } } : {};
    const revenueMatch = { status: "paid" };
    if (startDate) {
      revenueMatch.createdAt = { $gte: startDate };
    }

    const [orderStats] = await Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          revenueOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = Number((orderStats?.totalRevenue || 0).toFixed(2));
    const revenueOrders = orderStats?.revenueOrders || 0;

    const [recentSubmissions, recentSubmissionsCount] = await Promise.all([
      Product.find(submissionsQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("sellerId", "name email")
        .select("title sellerId category status createdAt")
        .lean(),
      Product.countDocuments(submissionsQuery),
    ]);

    const needsAttention = await Product.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status createdAt contentReviewed malwareScanDetails")
      .lean();

    const topSellerRevenue = await Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: "$sellerId",
          totalRevenue: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          _id: 1,
          name: "$seller.name",
          email: "$seller.email",
          totalRevenue: 1,
        },
      },
    ]);

    const productCounts = await Product.aggregate([
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]);

    const productCountMap = productCounts.reduce((acc, item) => {
      acc[item._id?.toString()] = item.count;
      return acc;
    }, {});

    const topSellers = topSellerRevenue.map((seller) => ({
      id: seller._id,
      name: seller.name,
      email: seller.email,
      productCount: productCountMap[seller._id?.toString()] || 0,
      revenue: Number((seller.totalRevenue || 0).toFixed(2)),
    }));

    let timelineLabels = [];
    let timelineCounts = [];

    if (days) {
      const submissions = await Product.find(submissionsQuery).select("createdAt").lean();
      const bucketCount = Math.max(1, Math.ceil(days / 7));
      const counts = Array(bucketCount).fill(0);

      submissions.forEach((submission) => {
        const diff = submission.createdAt - startDate;
        const bucketIndex = Math.min(
          bucketCount - 1,
          Math.max(0, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)))
        );
        counts[bucketIndex] += 1;
      });

      timelineLabels = counts.map((_, index) => `Week ${index + 1}`);
      timelineCounts = counts;
    } else {
      const monthly = await Product.aggregate([
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      timelineLabels = monthly.map((item) => `${monthNames[item._id.month - 1]} ${item._id.year}`);
      timelineCounts = monthly.map((item) => item.count);
    }

    const [approvalDuration] = await Product.aggregate([
      { $match: { status: "approved" } },
      { $project: { duration: { $subtract: ["$updatedAt", "$createdAt"] } } },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } },
    ]);

    const approvalRate = totalProducts ? (approved / totalProducts) * 100 : 0;
    const avgApprovalDays = approvalDuration?.avgDuration
      ? Number((approvalDuration.avgDuration / (1000 * 60 * 60 * 24)).toFixed(1))
      : 0;
    const activeSellers = (await Product.distinct("sellerId", { status: "approved" })).length;

    res.json({
      stats: { 
        total: totalProducts, 
        approved, 
        pending, 
        rejected,
        recentSubmissions: recentSubmissionsCount,
        totalRevenue,
        revenueOrders,
      },
      categories,
      topSellers,
      recentSubmissions: recentSubmissions.map((product) => ({
        _id: product._id,
        title: product.title,
        sellerName: product.sellerId?.name || "Unknown Seller",
        category: product.category || "Uncategorized",
        status: product.status,
        createdAt: product.createdAt,
      })),
      needsAttention: needsAttention.map((product) => ({
        _id: product._id,
        title: product.title,
        status: product.status,
        createdAt: product.createdAt,
        reason: "Pending review",
      })),
      timeline: { labels: timelineLabels, counts: timelineCounts },
      health: {
        approvalRate: Number(approvalRate.toFixed(1)),
        avgApprovalDays,
        activeSellers,
      },
    });
  } catch (error) {
    console.error("Error in getProductAnalytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// Generate PDF Report for Products
export const getProductReport = async (req, res) => {
  try {
    const products = await Product.find().populate("sellerId", "name email");
    
    const doc = new PDFDocument({ margin: 50 });
    const filename = `BitForge_Product_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    // Header
    doc.fillColor("#444444")
       .fontSize(20)
       .text("BitForge Catalog Report", 50, 50)
       .fontSize(10)
       .text(`Generated on: ${new Date().toLocaleString()}`, 200, 65, { align: "right" })
       .moveDown();

    doc.strokeColor("#aaaaaa")
       .lineWidth(1)
       .moveTo(50, 80)
       .lineTo(550, 80)
       .stroke();

    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).text("Inventory Summary", { underline: true });
    doc.moveDown();
    
    const stats = {
      Total: products.length,
      Approved: products.filter(p => p.status === 'approved').length,
      Pending: products.filter(p => p.status === 'pending').length,
      Rejected: products.filter(p => p.status === 'rejected').length
    };

    Object.entries(stats).forEach(([key, val]) => {
      doc.fontSize(12).text(`${key}: ${val}`, { indent: 20 });
    });

    doc.moveDown(2);

    // Products List
    doc.fontSize(16).text("Detailed Catalog", { underline: true });
    doc.moveDown();

    products.forEach((p, index) => {
      // Add new page if close to bottom
      if (doc.y > 650) doc.addPage();

      doc.fontSize(11)
         .fillColor("#000000")
         .text(`${index + 1}. ${p.title}`, { bold: true });
      
      doc.fontSize(9)
         .fillColor("#666666")
         .text(`Status: ${p.status.toUpperCase()}`, { indent: 15 })
         .text(`Seller: ${p.sellerId?.name || 'N/A'} (${p.sellerId?.email || 'N/A'})`, { indent: 15 })
         .text(`Price: Rs. ${p.price}`, { indent: 15 })
         .text(`Category: ${p.category || 'Uncategorized'}`, { indent: 15 })
         .text(`Added: ${new Date(p.createdAt).toLocaleDateString()}`, { indent: 15 });
      
      doc.moveDown(1);
    });

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor("#999999")
         .text(
           `BitForge Admin Panel - Page ${i + 1} of ${range.count}`,
           50,
           doc.page.height - 50,
           { align: "center", width: 500 }
         );
    }

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error in getProductReport:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

// Admin edit product
export const editProductByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, discount, editReason } = req.body;
    
    if (!editReason || String(editReason).trim().length < 3) {
      return res.status(400).json({ message: "Edit reason is required (min 3 characters)" });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Store original values for notification
    const originalData = {
      title: product.title,
      description: product.description,
      price: product.price,
      discount: product.discount,
    };
    
    // Update product
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (discount !== undefined) updateData.discount = discount;
    
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    
    // Create changes summary
    const changes = [];
    if (title !== undefined && title !== originalData.title) changes.push(`title: "${originalData.title}" → "${title}"`);
    if (description !== undefined && description !== originalData.description) changes.push("description updated");
    if (price !== undefined && price !== originalData.price) changes.push(`price: ₹${originalData.price} → ₹${price}`);
    if (discount !== undefined && discount !== originalData.discount) changes.push(`discount: ${originalData.discount}% → ${discount}%`);
    
    // Notify seller about product edit
    if (product.sellerId) {
      await createNotification(
        product.sellerId,
        "product_edited_by_admin",
        "Product Updated by Administrator",
        `Your product "${product.title}" has been updated by an administrator.\nChanges: ${changes.join(", ")}\nReason: ${String(editReason).trim()}`,
        product._id,
        "Product"
      );
    }

    res.json({ 
      message: "Product updated successfully",
      product: updatedProduct,
      changes 
    });
  } catch (error) {
    console.error("Error editing product by admin:", error);
    res.status(500).json({ message: "Failed to edit product" });
  }
};

// Admin delete product with reason
export const deleteProductByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteReason } = req.body;
    
    if (!deleteReason || String(deleteReason).trim().length < 5) {
      return res.status(400).json({ message: "Delete reason is required (min 5 characters)" });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const sellerId = product.sellerId;
    const productTitle = product.title;
    
    // Check if product has any purchases - if so, soft delete to preserve buyer access
    const hasPurchases = await Order.exists({ productId: id, status: "paid" });
    
    if (hasPurchases) {
      // Soft delete - keep files for buyers who purchased
      await Product.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
        status: "rejected", // Hide from marketplace
        rejectionReason: `Deleted by admin: ${String(deleteReason).trim()}`
      });
    } else {
      // No purchases - safe to hard delete and remove files
      if (product.fileKey) {
        try {
          if (product.storageProvider === "r2") {
            await deleteFromR2(product.fileKey);
          } else {
            await cloudinary.uploader.destroy(product.fileKey, { resource_type: "raw" });
          }
        } catch (err) {
          console.error("Storage delete error:", err);
        }
      }

      if (product.thumbnailKey) {
        try {
          await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
        } catch (err) {
          console.error("Cloudinary thumbnail delete error:", err);
        }
      }
      
      await Product.findByIdAndDelete(id);
    }
    
    // Notify seller about product deletion
    if (sellerId) {
      await createNotification(
        sellerId,
        "product_deleted_by_admin",
        "Product Deleted by Administrator",
        `Your product "${productTitle}" has been deleted by an administrator.\nReason: ${String(deleteReason).trim()}`,
        id,
        "Product"
      );
    }

    res.json({ 
      message: hasPurchases ? "Product archived (buyers retain access)" : "Product deleted successfully",
      deletedProduct: {
        id,
        title: productTitle,
        reason: String(deleteReason).trim(),
        softDeleted: !!hasPurchases
      }
    });
  } catch (error) {
    console.error("Error deleting product by admin:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// Set product to pending
export const pendingProduct = async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body;

  const product = await Product.findByIdAndUpdate(id, {
    status: "pending",
    rejectionReason: null,
  }, { new: true });

  if (product && product.sellerId) {
    // Write audit log
    const logData = {
      productId: product._id,
      productTitle: product.title,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'pending',
      adminNote,
      sellerId: product.sellerId,
      timestamp: new Date()
    };
    writeModerationLog(logData);

    await createNotification(
      product.sellerId,
      "product_under_review",
      "Product Under Review",
      `Your product "${product.title}" has been moved back to pending status for review.`,
      product._id,
      "Product",
      {
        actionUrl: "/dashboard/seller/products",
        pushWhenInactiveOnly: false
      }
    );
  }

  res.json({ message: "Product status set to pending" });
};

// Approve product
export const approveProduct = async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body;

  const product = await Product.findByIdAndUpdate(id, {
    status: "approved",
    rejectionReason: null,
  }, { new: true });

  if (product && product.sellerId) {
    const seller = await User.findByIdAndUpdate(product.sellerId, {
      $inc: {
        'sellerStats.totalProducts': 1,
        'sellerStats.approvedProducts': 1
      }
    });

    // Write audit log
    const logData = {
      productId: product._id,
      productTitle: product.title,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'approved',
      adminNote,
      sellerId: product.sellerId,
      sellerEmail: seller?.email,
      timestamp: new Date()
    };
    writeModerationLog(logData);

    // Send email
    if (seller) {
      try {
        await sendApprovalEmail(seller, product);
        ModerationLog.findOneAndUpdate(
          { productId: product._id, action: 'approved', timestamp: { $gte: new Date(Date.now() - 5000) } },
          { $set: { emailSent: true, emailSentAt: new Date() } }
        ).catch(e => console.error('Failed to update log with emailSent:', e.message));
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }
    }

    await createNotification(
      product.sellerId,
      "product_approved",
      "Product Approved! 🎉",
      `Your product "${product.title}" has been approved and is now live on the marketplace`,
      product._id,
      "Product",
      {
        actionUrl: "/dashboard/seller/products",
        pushWhenInactiveOnly: false
      }
    );
  }

  // Notify all buyers about new product availability
  try {
    const buyers = await User.find({ role: "buyer" });
    for (const buyer of buyers) {
      await createNotification(
        buyer._id,
        "product_approved",
        "New product available",
        `"${product.title}" is now live. Check it out!`,
        product._id,
        "Product",
        {
          actionUrl: `/product/${product._id}`,
          pushWhenInactiveOnly: false
        }
      );
    }
  } catch (notifyErr) {
    console.error("Buyer notification error (product approval):", notifyErr);
  }

  res.json({ message: "Product approved" });
};

// Reject product
export const rejectProduct = async (req, res) => {
  const { id } = req.params;
  const { reasons, adminNote } = req.body;

  if (!reasons || reasons.length === 0) {
    return res.status(400).json({ message: "Rejection reasons required" });
  }

  const product = await Product.findByIdAndUpdate(id, {
    status: "rejected",
    rejectionReason: reasons.join(', '),
  }, { new: true });

  if (product && product.sellerId) {
    const seller = await User.findByIdAndUpdate(product.sellerId, {
      $inc: {
        'sellerStats.rejectedProducts': 1
      }
    });

    // Write audit log
    const logData = {
      productId: product._id,
      productTitle: product.title,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'rejected',
      reasons,
      adminNote,
      sellerId: product.sellerId,
      sellerEmail: seller?.email,
      timestamp: new Date()
    };
    writeModerationLog(logData);

    // Send email
    if (seller) {
      try {
        await sendRejectionEmail(seller, product, reasons, adminNote);
        ModerationLog.findOneAndUpdate(
          { productId: product._id, action: 'rejected', timestamp: { $gte: new Date(Date.now() - 5000) } },
          { $set: { emailSent: true, emailSentAt: new Date() } }
        ).catch(e => console.error('Failed to update log with emailSent:', e.message));
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }
    }

    await createNotification(
      product.sellerId,
      "product_rejected",
      "Product Rejected",
      `Your product "${product.title}" was rejected. Reasons: ${reasons.join(', ')}`,
      product._id,
      "Product",
      {
        actionUrl: "/dashboard/seller/products",
        pushWhenInactiveOnly: false
      }
    );
  }

  res.json({ message: "Product rejected" });
};

// Request changes for product
export const requestProductChanges = async (req, res) => {
  const { id } = req.params;
  const { reasons, adminNote } = req.body;

  if (!reasons || reasons.length === 0) {
    return res.status(400).json({ message: "Change request reasons required" });
  }

  const product = await Product.findByIdAndUpdate(id, {
    status: "changes_requested",
    rejectionReason: reasons.join(', '), // Reusing field
  }, { new: true });

  if (product && product.sellerId) {
    const seller = await User.findByIdAndUpdate(product.sellerId, {
      $inc: {
        'sellerStats.changesRequested': 1
      }
    });

    // Write audit log
    const logData = {
      productId: product._id,
      productTitle: product.title,
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'changes_requested',
      reasons,
      adminNote,
      sellerId: product.sellerId,
      sellerEmail: seller?.email,
      timestamp: new Date()
    };
    writeModerationLog(logData);

    // Send email
    if (seller) {
      try {
        await sendChangesRequestedEmail(seller, product, reasons, adminNote);
        ModerationLog.findOneAndUpdate(
          { productId: product._id, action: 'changes_requested', timestamp: { $gte: new Date(Date.now() - 5000) } },
          { $set: { emailSent: true, emailSentAt: new Date() } }
        ).catch(e => console.error('Failed to update log with emailSent:', e.message));
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }
    }

    await createNotification(
      product.sellerId,
      "product_changes_requested",
      "Action Required: Changes Requested",
      `We need you to make some updates to "${product.title}" before it can be approved. Reasons: ${reasons.join(', ')}`,
      product._id,
      "Product",
      {
        actionUrl: "/dashboard/seller/products",
        pushWhenInactiveOnly: false
      }
    );
  }

  res.json({ message: "Changes requested" });
};

// Get pending product changes (updates/deletions)
export const getPendingProductChanges = async (req, res) => {
  try {
    const products = await Product.find({
      changeRequest: { $in: ["pending_update", "pending_deletion"] }
    })
      .populate("sellerId", "name email")
      .sort({ updatedAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Error fetching pending product changes:", error);
    res.status(500).json({ message: "Failed to fetch pending product changes" });
  }
};

// Approve product update
export const approveProductChange = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.changeRequest === "pending_update") {
      // Apply pending changes
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          title: product.pendingChanges.title,
          description: product.pendingChanges.description,
          price: product.pendingChanges.price,
          discount: product.pendingChanges.discount,
          fileKey: product.pendingChanges.fileKey,
          fileUrl: product.pendingChanges.fileUrl,
          thumbnailKey: product.pendingChanges.thumbnailKey,
          thumbnailUrl: product.pendingChanges.thumbnailUrl,
          changeRequest: "none",
          pendingChanges: null,
          changeRejectionReason: null,
        },
        { new: true }
      );

      // Notify seller about update approval
      await createNotification(
        product.sellerId,
        "product_change_approved",
        "Product Update Approved ",
        `Your update for "${product.title}" has been approved and is now live`,
        product._id,
        "Product",
        {
          actionUrl: "/dashboard/seller/products",
          pushWhenInactiveOnly: false
        }
      );

      // Notify buyers about updated product (broadcast)
      try {
        const buyers = await User.find({ role: "buyer" });
        for (const buyer of buyers) {
          await createNotification(
            buyer._id,
            "product_change_approved",
            "Product updated",
            `"${product.title}" has new changes. Take a look!`,
            product._id,
            "Product",
            {
              actionUrl: `/product/${product._id}`,
              pushWhenInactiveOnly: false
            }
          );
        }
      } catch (notifyErr) {
        console.error("Buyer notification error (product update):", notifyErr);
      }

      return res.json({ 
        message: "Product update approved",
        product: updatedProduct 
      });
    } else if (product.changeRequest === "pending_deletion") {
      // Check if product has any purchases - if so, soft delete to preserve buyer access
      const hasPurchases = await Order.exists({ productId: id, status: "paid" });
      
      if (hasPurchases) {
        // Soft delete - keep files for buyers who purchased
        await Product.findByIdAndUpdate(id, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id,
          changeRequest: "none",
          status: "rejected", // Hide from marketplace
          rejectionReason: "Deleted by seller request (archived for buyers)"
        });
      } else {
        // No purchases - safe to hard delete and remove files
        if (product.fileKey) {
          try {
            await cloudinary.uploader.destroy(product.fileKey, { resource_type: "raw" });
          } catch (err) {
            console.error("Cloudinary delete error:", err);
          }
        }
        if (product.thumbnailKey) {
          try {
            await cloudinary.uploader.destroy(product.thumbnailKey, { resource_type: "image" });
          } catch (err) {
            console.error("Cloudinary thumbnail delete error:", err);
          }
        }

        await Product.findByIdAndDelete(id);
      }

      // Notify seller about deletion approval
      await createNotification(
        product.sellerId,
        "product_change_approved",
        "Product Deletion Approved ",
        hasPurchases 
          ? `Your product "${product.title}" has been archived. Existing buyers retain access.`
          : `Your product "${product.title}" has been deleted as requested`,
        product._id,
        "Product",
        {
          actionUrl: "/dashboard/seller/products",
          pushWhenInactiveOnly: false
        }
      );

      return res.json({ 
        message: hasPurchases 
          ? "Product archived (buyers retain access)" 
          : "Product deletion approved and product removed",
        softDeleted: !!hasPurchases
      });
    }

    res.status(400).json({ message: "No pending changes to approve" });
  } catch (error) {
    console.error("Error approving product change:", error);
    res.status(500).json({ message: "Failed to approve product change" });
  }
};

// Reject product change
export const rejectProductChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason required" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        changeRequest: "none",
        pendingChanges: null,
        changeRejectionReason: reason,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Notify seller about change rejection
    await createNotification(
      product.sellerId,
      "product_change_rejected",
      "Product Change Rejected",
      `Your requested change for "${product.title}" was rejected. Reason: ${reason}`,
      product._id,
      "Product",
      {
        actionUrl: "/dashboard/seller/products",
        pushWhenInactiveOnly: false
      }
    );

    res.json({ 
      message: "Product change rejected",
      product 
    });
  } catch (error) {
    console.error("Error rejecting product change:", error);
    res.status(500).json({ message: "Failed to reject product change" });
  }
};


export const getPendingPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ status: "pending" })
      .populate("sellerId", "name email bankAccounts")
      .sort({ createdAt: -1 });

    // Format the response with detailed breakdown
    const formattedPayouts = payouts
      .filter(payout => payout.sellerId) // Filter out payouts with deleted sellers
      .map(payout => {
        const seller = payout.sellerId;
        const primaryAccount = seller?.bankAccounts?.find(acc => acc.isPrimary);

        return {
          _id: payout._id,
          sellerId: {
            id: seller._id,
            name: seller.name || 'Unknown Seller',
            email: seller.email || 'N/A',
          },
        primaryBankAccount: primaryAccount ? {
          accountHolderName: primaryAccount.accountHolderName,
          accountNumber: primaryAccount.accountNumber,
          ifscCode: primaryAccount.ifscCode,
          bankName: primaryAccount.bankName,
          branchName: primaryAccount.branchName,
        } : null,
        financialBreakdown: {
          requestedAmount: payout.amount,
          platformCommission: payout.platformCommission,
          gstOnCommission: payout.gstOnCommission,
          totalDeductions: payout.totalDeductions,
          netPayableAmount: payout.netPayableAmount,
        },
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
      };
    });

    console.log(`==> Admin fetching pending payouts: Found ${formattedPayouts.length} payouts`);
    res.json({ payouts: formattedPayouts });
  } catch (error) {
    console.error("Error fetching pending payouts:", error);
    res.status(500).json({ message: "Failed to fetch pending payouts" });
  }
};

export const uploadPayoutProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "payout_proofs",
      resource_type: "image",
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error uploading payout proof:", error);
    res.status(500).json({ message: "Failed to upload proof image" });
  }
};

export const approvePayout = async (req, res) => {
  try {
    const { utrNumber, paymentMode, paymentDate, proofImageUrl, adminNote } = req.body;
    
    const payout = await Payout.findById(req.params.id).populate("sellerId", "name email bankAccounts");
    
    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    if (payout.status !== "pending") {
      return res.status(400).json({ message: "Payout is not in pending status" });
    }

    const seller = payout.sellerId;

    // Get primary bank account
    const primaryAccount = seller.bankAccounts?.find(acc => acc.isPrimary);

    if (!primaryAccount) {
      return res.status(400).json({
        message: "Seller primary bank account not found",
      });
    }

    // Manual payment - Admin confirms payment has been made
    payout.status = "paid";
    payout.paidBy = req.user.id;
    payout.processedBy = req.user.id;
    payout.paidAt = new Date();
    payout.processedAt = new Date();
    payout.paymentMethod = paymentMode;
    payout.utrNumber = utrNumber;
    payout.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payout.proofImageUrl = proofImageUrl;
    payout.adminNote = adminNote;
    payout.paymentReference = utrNumber;
    await payout.save();

      await createNotification(
        seller._id,
        "payout_sent",
        "Payout processed",
        `Your payout of Rs. ${Number(payout.netPayableAmount || payout.amount || 0).toFixed(2)} has been marked as paid.`,
        payout._id,
        "Payout",
        {
          audienceRole: "seller",
        }
      );

      res.json({
        message: "Payout marked as paid successfully",
      payout: {
        id: payout._id,
        seller: {
          name: seller.name,
          email: seller.email,
        },
        bankAccount: {
          accountHolderName: primaryAccount.accountHolderName,
          accountNumber: primaryAccount.accountNumber,
          ifscCode: primaryAccount.ifscCode,
          bankName: primaryAccount.bankName,
        },
        amount: payout.netPayableAmount,
        utrNumber,
        paidAt: payout.paidAt,
      }
    });
  } catch (error) {
    console.error("Error approving payout:", error);
    res.status(500).json({ message: "Failed to approve payout" });
  }
};

export const rejectPayout = async (req, res) => {
  try {
    const { reasons, message } = req.body;
    
    if (!reasons || reasons.length === 0) {
      return res.status(400).json({ message: "At least one rejection reason is required" });
    }
    
      const payout = await Payout.findByIdAndUpdate(
        req.params.id,
        {
          status: "rejected",
          rejectionReasons: reasons,
          rejectionMessage: message,
          rejectionReason: reasons.join(", "),
          processedAt: new Date(),
          processedBy: req.user.id,
        },
        { new: true }
      ).populate("sellerId", "name");

      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }

      if (payout.sellerId?._id) {
        await createNotification(
          payout.sellerId._id,
          "payout_rejected",
          "Payout rejected",
          `Your payout request was rejected. Reasons: ${reasons.join(", ")}`,
          payout._id,
          "Payout",
          {
            audienceRole: "seller",
          }
        );
      }

      res.json({ message: "Payout rejected", payout });
  } catch (error) {
    console.error("Error rejecting payout:", error);
    res.status(500).json({ message: "Failed to reject payout" });
  }
};

// Get detailed payout information with commission breakdown
export const getPayoutDetails = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id)
      .populate("sellerId", "name email bankAccounts")
      .populate("paidBy", "name email");

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    const seller = payout.sellerId;
    const primaryAccount = seller.bankAccounts?.find(acc => acc.isPrimary);

    res.json({
      _id: payout._id,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
      },
      primaryBankAccount: primaryAccount ? {
        accountHolderName: primaryAccount.accountHolderName,
        accountNumber: primaryAccount.accountNumber,
        ifscCode: primaryAccount.ifscCode,
        bankName: primaryAccount.bankName,
        branchName: primaryAccount.branchName,
      } : null,
      financialBreakdown: {
        requestedAmount: payout.amount,
        platformCommission: payout.platformCommission,
        gstOnCommission: payout.gstOnCommission,
        totalDeductions: payout.totalDeductions,
        netPayableAmount: payout.netPayableAmount,
      },
      status: payout.status,
      paymentMethod: payout.paymentMethod,
      paymentReference: payout.paymentReference,
      paymentNotes: payout.paymentNotes,
      paidBy: payout.paidBy,
      paidAt: payout.paidAt,
      rejectionReason: payout.rejectionReason,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching payout details:", error);
    res.status(500).json({ message: "Failed to fetch payout details" });
  }
};

// Get all payouts with filters (for admin dashboard) — returns rich format
export const getAllPayouts = async (req, res) => {
  try {
    const {
      status = "all",
      limit = 100,
      page = 1,
      search = "",
      sort = "newest",
    } = req.query;

    const limitNum = parseInt(limit) || 100;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== "all") {
      if (status === "history") {
        filter.status = { $in: ["paid", "rejected"] };
      } else {
        filter.status = status;
      }
    }

    const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchTerm = typeof search === "string" ? search.trim() : "";
    if (searchTerm) {
      const safeSearch = escapeRegExp(searchTerm);
      const sellerMatches = await User.find({
        role: "seller",
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
        ],
      }).select("_id");

      const sellerIds = sellerMatches.map(s => s._id);
      const payoutToken = searchTerm.replace(/^pay-/i, "").trim();
      const payoutTokenSafe = payoutToken ? escapeRegExp(payoutToken) : "";
      const payoutIdRegex = payoutTokenSafe ? new RegExp(`${payoutTokenSafe}$`, "i") : null;

      const orConditions = [];
      if (sellerIds.length) {
        orConditions.push({ sellerId: { $in: sellerIds } });
      }
      if (payoutIdRegex) {
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: payoutIdRegex,
            },
          },
        });
      }

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      } else {
        filter._id = { $exists: false };
      }
    }

    const sortStage = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const payouts = await Payout.find(filter)
      .populate("sellerId", "name email bankAccounts createdAt")
      .populate("paidBy", "name email")
      .sort(sortStage)
      .limit(limitNum)
      .skip(skip);

    const total = await Payout.countDocuments(filter);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statsResult] = await Payout.aggregate([
      {
        $group: {
          _id: null,
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          pendingValue: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
          paidThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "paid"] }, { $gte: ["$processedAt", startOfMonth] }] }, 1, 0] } },
          rejectedThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "rejected"] }, { $gte: ["$processedAt", startOfMonth] }] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsResult || {
      pendingCount: 0,
      pendingValue: 0,
      paidThisMonth: 0,
      rejectedThisMonth: 0
    };

    // We need product counts for each seller
    const sellerIds = [...new Set(payouts.map(p => p.sellerId?._id?.toString()).filter(Boolean))];
    const productCountsResult = await Product.aggregate([
      { $match: { sellerId: { $in: sellerIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } }
    ]);
    
    const productCounts = productCountsResult.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const formattedPayouts = payouts.map(payout => {
      const seller = payout.sellerId;
      const primaryAccount = seller?.bankAccounts?.find(acc => acc.isPrimary);
      const sid = seller?._id?.toString();

      return {
        id: payout._id,
        payoutNumber: `PAY-${payout._id.toString().slice(-6).toUpperCase()}`,
        seller: seller ? {
          id: seller._id,
          name: seller.name || 'Unknown Seller',
          email: seller.email || 'N/A',
          joinedAt: seller.createdAt,
          totalProducts: sid ? (productCounts[sid] || 0) : 0
        } : null,
        bankDetails: primaryAccount ? {
          holderName: primaryAccount.accountHolderName,
          accountNumber: primaryAccount.accountNumber,
          ifsc: primaryAccount.ifscCode,
          bankName: primaryAccount.bankName,
        } : null,
        amount: payout.amount,
        status: payout.status,
        requestedAt: payout.createdAt,
        processedAt: payout.processedAt || payout.paidAt,
        adminNote: payout.adminNote || payout.paymentNotes,
        rejectionReasons: payout.rejectionReasons || (payout.rejectionReason ? [payout.rejectionReason] : []),
        rejectionMessage: payout.rejectionMessage,
        utrNumber: payout.utrNumber || payout.paymentReference,
        paymentMode: payout.paymentMethod,
        paymentDate: payout.paymentDate,
        proofImageUrl: payout.proofImageUrl,
      };
    });

    res.json({
      stats: {
        pendingPayouts: stats.pendingCount,
        pendingValue: stats.pendingValue,
        paidThisMonth: stats.paidThisMonth,
        rejectedThisMonth: stats.rejectedThisMonth
      },
      payouts: formattedPayouts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    console.error("Error fetching all payouts:", error);
    res.status(500).json({ message: "Failed to fetch payouts" });
  }
};

// Get commission and GST summary
export const getCommissionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get all paid payouts
    const payouts = await Payout.find({ 
      status: "paid",
      ...dateFilter 
    });

    const totalCommissionEarned = payouts.reduce(
      (sum, payout) => sum + (payout.platformCommission || 0), 0
    );
    
    const totalGSTCollected = payouts.reduce(
      (sum, payout) => sum + (payout.gstOnCommission || 0), 0
    );
    
    const totalPayoutsMade = payouts.reduce(
      (sum, payout) => sum + (payout.netPayableAmount || 0), 0
    );

    const totalAmountProcessed = payouts.reduce(
      (sum, payout) => sum + (payout.amount || 0), 0
    );

    res.json({
      summary: {
        totalPayouts: payouts.length,
        totalAmountProcessed, // Total earnings sellers requested
        totalCommissionEarned, // Platform's commission (10%)
        totalGSTCollected, // GST on commission (18% of commission)
        totalPayoutsMade, // Net amount paid to sellers
        totalRetainedByPlatform: totalCommissionEarned + totalGSTCollected,
      },
      breakdown: {
        commissionRate: "10%",
        gstRate: "18%",
        effectiveCommissionWithGST: "11.8%", // 10% + (10% * 18%)
      },
      dateRange: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      }
    });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    res.status(500).json({ message: "Failed to fetch commission summary" });
  }
};

export const getAllDisputes = async (req, res) => {
  try {
    const { status, search, sort, page = 1, limit = 10 } = req.query;

    let matchStage = {};
    if (status && status !== "all") {
      matchStage.status = status;
    }

    let sortStage = { createdAt: -1 };
    if (sort === "oldest") sortStage = { createdAt: 1 };
    if (sort === "amount_high") sortStage = { amount: -1 };
    if (sort === "amount_low") sortStage = { amount: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await Dispute.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                openCount: {
                  $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
                },
                resolvedToday: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "resolved"] },
                          { $gte: ["$updatedAt", startOfDay] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                totalRefundValue: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "resolved"] }, "$amount", 0],
                  },
                },
              },
            },
          ],
          disputes: [
            { $match: matchStage },
            {
              $lookup: {
                from: "orders",
                localField: "orderId",
                foreignField: "_id",
                as: "order",
              },
            },
            { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                sellerId: { $ifNull: ["$sellerId", "$order.sellerId"] },
                productId: { $ifNull: ["$productId", "$order.productId"] },
                amount: { $ifNull: ["$amount", "$order.amount"] },
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "buyerId",
                foreignField: "_id",
                as: "buyer",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "sellerId",
                foreignField: "_id",
                as: "seller",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        { "buyer.email": { $regex: search, $options: "i" } },
                        { "buyer.name": { $regex: search, $options: "i" } },
                        { "seller.email": { $regex: search, $options: "i" } },
                        { "seller.name": { $regex: search, $options: "i" } },
                        { "product.title": { $regex: search, $options: "i" } },
                        { reason: { $regex: search, $options: "i" } },
                      ],
                    },
                  },
                ]
              : []),
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limitNum },
          ],
        },
      },
    ]);

    const statsData = result[0].stats[0] || {
      openCount: 0,
      resolvedToday: 0,
      totalRefundValue: 0,
    };

    const formattedDisputes = result[0].disputes.map((d) => {
      return {
        id: d._id,
        disputeNumber: `DIS-${d._id.toString().slice(-6).toUpperCase()}`,
        productTitle: d.product?.title || "Unknown Product",
        productCategory: d.product?.category || "Unknown",
        productFileType: d.product?.fileType || "Unknown",
        buyer: {
          name: d.buyer?.name || "Unknown",
          email: d.buyer?.email || "N/A",
        },
        seller: {
          name: d.seller?.name || "Unknown",
          email: d.seller?.email || "N/A",
        },
        reason: d.reason || "",
        refundAmount: d.amount || 0,
        originalPrice: d.amount || 0,
        status: d.status,
        createdAt: d.createdAt,
        resolvedAt: d.status === "resolved" ? d.updatedAt : undefined,
        adminNote: d.adminNote,
        history: [
          { timestamp: d.createdAt, action: "Dispute opened" },
          ...(new Date(d.updatedAt).getTime() !== new Date(d.createdAt).getTime()
            ? [
                {
                  timestamp: d.updatedAt,
                  action: `Status changed to ${d.status}`,
                },
              ]
            : []),
        ],
      };
    });

    res.json({
      stats: {
        open: statsData.openCount,
        pending: statsData.openCount,
        resolvedToday: statsData.resolvedToday,
        totalValue: statsData.totalRefundValue,
      },
      disputes: formattedDisputes,
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({ message: "Failed to load disputes" });
  }
};

export const getDisputeAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const days = range && range !== "all" ? Number(range) : null;
    const now = new Date();
    const startDate = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;

    const [totalDisputes, open, resolved, rejected] = await Promise.all([
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: "open" }),
      Dispute.countDocuments({ status: "resolved" }),
      Dispute.countDocuments({ status: "rejected" }),
    ]);

    // Category breakdown
    const categories = await Dispute.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const submissionsQuery = startDate ? { createdAt: { $gte: startDate } } : {};

    const [orderStats] = await Dispute.aggregate([
      { $match: submissionsQuery },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$amount" },
        },
      },
    ]);

    const totalValue = Number((orderStats?.totalValue || 0).toFixed(2));

    const [recentSubmissions, recentSubmissionsCount] = await Promise.all([
      Dispute.find(submissionsQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("sellerId", "name email")
        .populate("buyerId", "name email")
        .populate("productId", "title")
        .lean(),
      Dispute.countDocuments(submissionsQuery),
    ]);

    // Needs attention: oldest open disputes
    const needsAttention = await Dispute.find({ status: "open" })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate("productId", "title")
      .select("category status createdAt reason amount")
      .lean();

    const topSellerDisputes = await Dispute.aggregate([
      { $match: submissionsQuery },
      {
        $group: {
          _id: "$sellerId",
          totalDisputedValue: { $sum: "$amount" },
          totalDisputes: { $sum: 1 },
        },
      },
      { $sort: { totalDisputedValue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          _id: 1,
          name: "$seller.name",
          email: "$seller.email",
          totalDisputedValue: 1,
          totalDisputes: 1,
        },
      },
    ]);

    const topSellers = topSellerDisputes.map((seller) => ({
      id: seller._id,
      name: seller.name,
      email: seller.email,
      disputeCount: seller.totalDisputes || 0,
      disputedValue: Number((seller.totalDisputedValue || 0).toFixed(2)),
    }));

    let timelineLabels = [];
    let timelineCounts = [];

    if (days && days <= 90) {
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }
      timelineLabels = dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const timelineData = await Dispute.aggregate([
        { $match: submissionsQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        }
      ]);

      const dataMap = timelineData.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      timelineCounts = dates.map(dateStr => dataMap[dateStr] || 0);
    } else {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }
      
      const timelineData = await Dispute.aggregate([
        { $match: submissionsQuery },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      timelineLabels = months.map(m => {
        const date = new Date(m.year, m.month - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });

      timelineCounts = months.map(m => {
        const found = timelineData.find(d => d._id.year === m.year && d._id.month === m.month);
        return found ? found.count : 0;
      });
    }

    const resolutionRate = totalDisputes > 0 ? (resolved / totalDisputes) * 100 : 0;
    const activeDisputes = await Dispute.countDocuments({ status: { $in: ["open", "under_review"] } });

    res.json({
      stats: {
        total: totalDisputes,
        open,
        resolved,
        rejected,
        recentSubmissions: recentSubmissionsCount,
        totalValue,
      },
      categories,
      topSellers,
      recentSubmissions: recentSubmissions.map(d => ({
        _id: d._id,
        title: d.productId?.title || 'Unknown Product',
        sellerName: d.sellerId?.name || 'Unknown',
        buyerName: d.buyerId?.name || 'Unknown',
        category: d.category,
        status: d.status,
        amount: d.amount,
        createdAt: d.createdAt
      })),
      needsAttention: needsAttention.map(d => ({
        _id: d._id,
        title: d.productId?.title || 'Unknown Product',
        status: d.status,
        createdAt: d.createdAt,
        reason: d.reason,
        amount: d.amount
      })),
      timeline: { labels: timelineLabels, counts: timelineCounts },
      health: {
        resolutionRate: Number(resolutionRate.toFixed(1)),
        avgResolutionDays: 0,
        activeDisputes,
      },
    });
  } catch (error) {
    console.error("Error in getDisputeAnalytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export const getMonthlyGSTReport = async (req, res) => {
  const { month, year } = req.query;

  const invoices = await Invoice.find({
    createdAt: {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    },
  });

  const totalGST = invoices.reduce(
    (sum, i) => sum + i.gstAmount,
    0
  );

  res.json({
    count: invoices.length,
    totalGST,
    invoices,
  });
};

// Get all sellers with their bank account status
export const getAllSellersWithBankAccounts = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" })
      .select("name email bankAccounts isApproved approvalStatus createdAt");

    const sellersData = sellers.map(seller => {
      const primaryAccount = seller.bankAccounts.find(acc => acc.isPrimary);
      
      return {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        isApproved: seller.isApproved,
        approvalStatus: seller.approvalStatus,
        totalBankAccounts: seller.bankAccounts.length,
        hasPrimaryAccount: !!primaryAccount,
        primaryAccount: primaryAccount ? {
          accountHolderName: primaryAccount.accountHolderName,
          accountNumber: '****' + primaryAccount.accountNumber.slice(-4),
          ifscCode: primaryAccount.ifscCode,
          bankName: primaryAccount.bankName,
          isVerified: primaryAccount.isVerified,
        } : null,
        createdAt: seller.createdAt,
      };
    });

    res.json(sellersData);
  } catch (error) {
    console.error("Error fetching sellers with bank accounts:", error);
    res.status(500).json({ message: "Failed to fetch sellers data" });
  }
};

// Get seller bank account details (admin view)
export const getSellerBankAccount = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId).select("name email role bankAccounts");

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (!seller.bankAccounts || seller.bankAccounts.length === 0) {
      return res.status(404).json({ message: "Seller has not added any bank accounts" });
    }

    const accounts = seller.bankAccounts.map(acc => ({
      id: acc._id,
      accountHolderName: acc.accountHolderName,
      accountNumber: '****' + acc.accountNumber.slice(-4),
      ifscCode: acc.ifscCode,
      bankName: acc.bankName,
      branchName: acc.branchName,
      accountType: acc.accountType,
      isPrimary: acc.isPrimary,
      isVerified: acc.isVerified,
      createdAt: acc.createdAt,
    }));

    res.json({
      sellerId: seller._id,
      sellerName: seller.name,
      sellerEmail: seller.email,
      totalAccounts: accounts.length,
      bankAccounts: accounts,
    });
  } catch (error) {
    console.error("Error fetching seller bank account:", error);
    res.status(500).json({ message: "Failed to fetch seller bank account" });
  }
};

// Get admin's own bank account stats
export const getAdminBankStats = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select("bankAccounts");

    // Fetch all paid orders to compute breakdowns
    const orders = await Order.find({ status: "paid" });
    
    let totalPaymentArrived = 0;
    let totalActualPayment = 0;
    let totalGST = 0;
    let totalBuyerCommission = 0;
    let totalSellerCommission = 0;
    let totalSellerEarnings = 0;

    orders.forEach(order => {
      totalPaymentArrived += order.amount || 0;
      
      const sellerAmount = order.sellerAmount || 0;
      // sellerAmount is 90% of actual payment
      const actualPayment = sellerAmount / 0.90;
      
      totalActualPayment += actualPayment;
      totalSellerEarnings += sellerAmount;
      totalSellerCommission += (actualPayment * 0.10);
      totalBuyerCommission += (actualPayment * 0.02);
      totalGST += (actualPayment * 0.05);
    });

    const totalCommissionEarned = totalSellerCommission + totalBuyerCommission;

    // Calculate total payouts made to sellers (approved/paid)
    const payouts = await Payout.find({ status: { $in: ["approved", "paid", "processing"] } });
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);

    const totalClaimableBySellers = totalSellerEarnings - totalPayouts;

    const primaryAccount = admin.bankAccounts.find(acc => acc.isPrimary);

    res.json({
      totalBankAccounts: admin.bankAccounts.length,
      hasPrimaryAccount: !!primaryAccount,
      primaryAccount: primaryAccount ? {
        id: primaryAccount._id,
        accountHolderName: primaryAccount.accountHolderName,
        accountNumber: '****' + primaryAccount.accountNumber.slice(-4),
        ifscCode: primaryAccount.ifscCode,
        bankName: primaryAccount.bankName,
        isVerified: primaryAccount.isVerified,
      } : null,
      stats: {
        totalPaymentArrived,
        totalActualPayment,
        totalGST,
        totalBuyerCommission,
        totalSellerCommission,
        totalCommissionEarned,
        totalPayoutsMade: totalPayouts,
        totalClaimableBySellers,
        netBalance: totalPaymentArrived - totalPayouts,
      }
    });
  } catch (error) {
    console.error("Error fetching admin bank stats:", error);
    res.status(500).json({ message: "Failed to fetch admin bank stats" });
  }
};
// Get admin dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total revenue (all paid orders)
    const orders = await Order.find({ status: "paid" });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    // Get platform revenue (commission from all paid orders + seller platform fee)
    const platformRevenue = orders.reduce((sum, order) => {
      const buyerFee = order.platformFee || 0;
      // Seller fee is 10% of base price. basePrice = sellerAmount / 0.9
      const sellerFee = order.sellerAmount ? (order.sellerAmount / 0.9) * 0.1 : 0;
      return sum + buyerFee + sellerFee;
    }, 0);
    
    const roundedPlatformRevenue = Number(platformRevenue.toFixed(2));

    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get total buyers (users with buyer role)
    const totalBuyers = await User.countDocuments({ role: "buyer" });
    
    // Get total sellers (approved sellers - check both fields for backward compatibility)
    const totalSellers = await User.countDocuments({ 
      role: "seller", 
      $or: [
        { approvalStatus: "approved" },
        { isApproved: true }
      ]
    });
    
    // Get pending sellers
    const pendingSellers = await User.find({ role: "seller", approvalStatus: "pending" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get total products (approved products, excluding soft-deleted)
    const totalProducts = await Product.countDocuments({ 
      status: "approved",
      isDeleted: { $ne: true }
    });

    // Get recent transactions (last 10)
    const recentTransactions = await Order.find({ status: "paid" })
      .populate("buyerId", "name email")
      .populate("productId", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    // Format transactions (use stored productName, fallback to populated title)
    const formattedTransactions = recentTransactions.map(order => ({
      id: order._id,
      orderId: order.razorpayOrderId || order._id,
      user: order.buyerId?.name || "Unknown",
      userEmail: order.buyerId?.email,
      productName: order.productName || order.productId?.title || "Unknown Product",
      amount: `₹${order.amount?.toLocaleString()}`,
      rawAmount: order.amount,
      date: order.createdAt,
    }));

    // Calculate monthly data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          buyerRevenue: { $sum: "$platformFee" },
          sellerAmountSum: { $sum: "$sellerAmount" },
          users: { $addToSet: "$buyerId" }
        }
      },
      {
        $project: {
          revenue: {
            $add: [
              { $ifNull: ["$buyerRevenue", 0] },
              { $multiply: [ { $divide: [ { $ifNull: ["$sellerAmountSum", 0] }, 0.9 ] }, 0.1 ] }
            ]
          },
          users: 1
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Format monthly data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const platformAnalytics = monthlyOrders.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Number((item.revenue || 0).toFixed(2)),
      users: item.users.length
    }));

    // Calculate user growth percentage
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const usersLastMonth = await User.countDocuments({ 
      createdAt: { $lte: lastMonth } 
    });
    
    const userGrowth = usersLastMonth > 0 
      ? ((totalUsers - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : 0;

    const openDisputes = await Dispute.countDocuments({ status: "open" });

    res.json({
      totalRevenue,
      platformRevenue: roundedPlatformRevenue,
      totalUsers,
      totalBuyers,
      totalSellers,
      totalProducts,
      openDisputes,
      userGrowth: parseFloat(userGrowth),
      pendingSellers: pendingSellers.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        appliedDate: s.createdAt
      })),
      recentTransactions: formattedTransactions,
      platformAnalytics,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
};

// Get pending seller deletion requests
export const getPendingSellerDeletions = async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      deletionRequestStatus: 'pending'
    }).select('name email deletionRequestReason deletionRequestDate').sort({ deletionRequestDate: -1 });

    res.json(sellers);
  } catch (error) {
    console.error("Error fetching pending seller deletions:", error);
    res.status(500).json({ message: "Failed to fetch pending deletions" });
  }
};

// Approve seller account deletion — soft-delete (preserve data, block login)
export const approveSellerDeletion = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await User.findById(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: "User is not a seller" });
    }

    if (seller.deletionRequestStatus !== 'pending') {
      return res.status(400).json({ message: "No pending deletion request for this seller" });
    }

    // Soft-delete: set accountStatus to 'deleted', preserve all data
    seller.accountStatus = 'deleted';
    seller.accountStatusUpdatedAt = new Date();
    seller.deletedAt = new Date();
    seller.deletionRequestStatus = 'approved';
    await seller.save();

    // Notify seller about approval
    try {
      await createNotification(
        seller._id,
        'seller_deletion_approved',
        'Account Deletion Approved',
        'Your account deletion request has been approved. Your account has been deactivated and your data has been preserved.',
        seller._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying seller about deletion approval:", notifyErr);
    }

    res.json({ message: "Seller account deactivated successfully" });
  } catch (error) {
    console.error("Error approving seller deletion:", error);
    res.status(500).json({ message: "Failed to approve deletion" });
  }
};

// Reject seller account deletion
export const rejectSellerDeletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({ message: "Rejection reason is required (min 3 characters)" });
    }

    const seller = await User.findById(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: "User is not a seller" });
    }

    if (seller.deletionRequestStatus !== 'pending') {
      return res.status(400).json({ message: "No pending deletion request for this seller" });
    }

    // Update seller status
    seller.deletionRequestStatus = 'rejected';
    seller.deletionRejectionReason = String(reason).trim();
    await seller.save();

    // Notify seller about rejection
    try {
      await createNotification(
        seller._id,
        'seller_deletion_rejected',
        'Account Deletion Rejected',
        `Your account deletion request has been rejected. Reason: ${seller.deletionRejectionReason}`,
        seller._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying seller about deletion rejection:", notifyErr);
    }

    res.json({ message: "Seller deletion request rejected" });
  } catch (error) {
    console.error("Error rejecting seller deletion:", error);
    res.status(500).json({ message: "Failed to reject deletion" });
  }
};

// Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "all",
      sort = "newest",
      isVerified = "all",
    } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);

    const query = {};
    if (role !== "all") {
      query.role = role;
    }

    if (isVerified === "true") {
      query.isVerified = true;
    } else if (isVerified === "false") {
      query.isVerified = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password -deletionOTP -deletionOTPExpire")
      .lean();

    const buyerIds = users
      .filter((user) => user.role === "buyer")
      .map((user) => user._id);
    const sellerIds = users
      .filter((user) => user.role === "seller")
      .map((user) => user._id);

    const buyerOrderStats = buyerIds.length > 0
      ? await Order.aggregate([
          {
            $match: {
              buyerId: { $in: buyerIds },
              status: "paid",
            }
          },
          {
            $group: {
              _id: "$buyerId",
              purchases: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ["$amount", 0] } },
              lastPurchaseAt: { $max: "$createdAt" },
            }
          }
        ])
      : [];
    const sellerOrderStats = sellerIds.length > 0
      ? await Order.aggregate([
          {
            $match: {
              sellerId: { $in: sellerIds },
              status: "paid",
            }
          },
          {
            $group: {
              _id: "$sellerId",
              sales: { $sum: 1 },
              totalEarnings: {
                $sum: {
                  $ifNull: ["$sellerAmount", { $ifNull: ["$amount", 0] }]
                }
              },
              lastSaleAt: { $max: "$createdAt" },
            }
          }
        ])
      : [];

    const buyerStatsMap = new Map(
      buyerOrderStats.map((item) => [
        String(item._id),
        {
          purchases: item.purchases || 0,
          totalSpent: item.totalSpent || 0,
          lastPurchaseAt: item.lastPurchaseAt || null,
        }
      ])
    );
    const sellerStatsMap = new Map(
      sellerOrderStats.map((item) => [
        String(item._id),
        {
          sales: item.sales || 0,
          totalEarnings: item.totalEarnings || 0,
          lastSaleAt: item.lastSaleAt || null,
        }
      ])
    );

    const usersWithStats = users.map((user) => {
      const buyerStats = buyerStatsMap.get(String(user._id)) || {
        purchases: 0,
        totalSpent: 0,
        lastPurchaseAt: null,
      };
      const sellerStats = sellerStatsMap.get(String(user._id)) || {
        sales: 0,
        totalEarnings: 0,
        lastSaleAt: null,
      };

      return {
        ...user,
        purchases: user.role === "buyer" ? buyerStats.purchases : sellerStats.sales,
        totalSpent: user.role === "buyer" ? buyerStats.totalSpent : sellerStats.totalEarnings,
        lastPurchaseAt: user.role === "buyer" ? buyerStats.lastPurchaseAt : sellerStats.lastSaleAt,
      };
    });

    usersWithStats.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sort === "az") {
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
      }

      if (sort === "spend") {
        return (b.totalSpent || 0) - (a.totalSpent || 0)
          || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sort === "purchases") {
        return (b.purchases || 0) - (a.purchases || 0)
          || (b.totalSpent || 0) - (a.totalSpent || 0)
          || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = usersWithStats.length;
    const skip = (pageNumber - 1) * limitNumber;
    const paginatedUsers = usersWithStats.slice(skip, skip + limitNumber);

    const [
      totalBuyers,
      verifiedBuyers,
      unverifiedBuyers,
      totalSellers,
      verifiedSellers,
      unverifiedSellers,
      platformSpendSummary,
      sellerEarningsSummary,
    ] = await Promise.all([
      User.countDocuments({ role: "buyer" }),
      User.countDocuments({ role: "buyer", isVerified: true }),
      User.countDocuments({ role: "buyer", isVerified: false }),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "seller", isVerified: true }),
      User.countDocuments({ role: "seller", isVerified: false }),
      Order.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: { $ifNull: ["$amount", 0] } },
          }
        }
      ]),
      Order.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            totalEarnings: {
              $sum: {
                $ifNull: ["$sellerAmount", { $ifNull: ["$amount", 0] }]
              }
            },
          }
        }
      ]),
    ]);

    const platformTotalSpent = platformSpendSummary[0]?.totalSpent || 0;
    const sellerTotalEarnings = sellerEarningsSummary[0]?.totalEarnings || 0;
    const statsByRole = role === "seller"
      ? {
          totalUsersForRole: totalSellers,
          verifiedUsersForRole: verifiedSellers,
          unverifiedUsersForRole: unverifiedSellers,
          totalValueForRole: sellerTotalEarnings,
        }
      : {
          totalUsersForRole: totalBuyers,
          verifiedUsersForRole: verifiedBuyers,
          unverifiedUsersForRole: unverifiedBuyers,
          totalValueForRole: platformTotalSpent,
        };

    res.json({
      users: paginatedUsers,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.max(Math.ceil(total / limitNumber), 1)
      },
      stats: {
        totalBuyers,
        verifiedBuyers,
        unverifiedBuyers,
        totalSellers,
        verifiedSellers,
        unverifiedSellers,
        platformTotalSpent,
        sellerTotalEarnings,
        ...statsByRole,
      }
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Update user profile (name and profile picture)
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profilePictureUrl } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    const updateData = { name: name.trim() };
    
    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Notify user about profile update
    try {
      const changes = [];
      if (name.trim() !== user.name) changes.push("name");
      if (profilePictureUrl !== undefined) changes.push("profile picture");
      
      await createNotification(
        user._id,
        'profile_edited_by_admin',
        'Profile Updated by Administrator',
        `An administrator has updated your profile information (${changes.join(', ')}).`,
        user._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying user about profile update:", notifyErr);
    }

    res.json({ message: "User profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
};

// Get specific user by ID (for admin detailed view)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get stats based on role
    let stats = {};
    if (user.role === 'seller') {
      const [totalProducts, sellerOrderSummary] = await Promise.all([
        Product.countDocuments({ sellerId: user._id }),
        Order.aggregate([
          {
            $match: {
              sellerId: user._id,
              status: "paid",
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ["$amount", 0] } },
            }
          }
        ]),
      ]);

      stats = {
        totalProducts,
        totalOrders: sellerOrderSummary[0]?.totalOrders || 0,
        totalSpent: sellerOrderSummary[0]?.totalSpent || 0,
      };
    } else if (user.role === 'buyer') {
      const buyerOrderSummary = await Order.aggregate([
        {
          $match: {
            buyerId: user._id,
            status: "paid",
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: { $ifNull: ["$amount", 0] } },
          }
        }
      ]);

      stats = {
        totalOrders: buyerOrderSummary[0]?.totalOrders || 0,
        totalSpent: buyerOrderSummary[0]?.totalSpent || 0,
      };
    }

    res.json({ user, stats });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// Ban/Suspend user by admin
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ message: "Ban reason is required (min 5 characters)" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow admin to ban themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot ban your own account" });
    }

    user.accountStatus = 'banned';
    user.accountStatusUpdatedAt = new Date();
    user.bannedReason = String(reason).trim();
    await user.save();

    res.json({
      message: "User account suspended successfully",
      bannedUser: { name: user.name, email: user.email, bannedReason: user.bannedReason },
    });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Failed to ban user" });
  }
};

// Soft delete user by admin
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    user.accountStatus = 'deleted';
    user.accountStatusUpdatedAt = new Date();
    user.bannedReason = "Account deleted by admin";
    await user.save();

    res.json({
      message: "User account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Unban user by admin (restore accountStatus to active)
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.accountStatus !== 'banned') {
      return res.status(400).json({ message: "User is not currently banned" });
    }

    user.accountStatus = 'active';
    user.accountStatusUpdatedAt = new Date();
    user.bannedReason = undefined;
    await user.save();

    // Notify user about unban
    try {
      await createNotification(
        user._id,
        'account_unbanned_by_admin',
        'Account Reinstated',
        'Your account suspension has been lifted. You can now log in again.',
        user._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying user about unban:", notifyErr);
    }

    res.json({ message: "User account reinstated successfully", user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ message: "Failed to unban user" });
  }
};
// Update user product limit
export const updateUserLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { productLimit } = req.body;

    if (productLimit === undefined || isNaN(Number(productLimit)) || Number(productLimit) < 0) {
      return res.status(400).json({ message: "Invalid product limit value" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { productLimit: Number(productLimit) },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Product limit updated successfully", user });
  } catch (error) {
    console.error("Error updating user limit:", error);
    res.status(500).json({ message: "Failed to update user limit" });
  }
};

// Get all transactions (buyer payments + seller payouts)
export const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "all",
      status = "all",
      sortBy = "date_desc",
      userId,
      dateRange,
      startDate,
      endDate,
    } = req.query;
    const normalizedType = typeof type === "string" ? type.toLowerCase() : "all";
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "all";
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let scopedUser = null;
    if (userId) {
      scopedUser = await User.findById(userId).select("role");
      if (!scopedUser) {
        return res.status(404).json({ message: "User not found" });
      }
    }
    
    let dateQuery = null;
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "7d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      else if (dateRange === "30d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      else if (dateRange === "90d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 90)) };
    } else if (startDate && endDate) {
      // Create a Date object for endDate and push it to the end of the day to include the whole day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery = { $gte: new Date(startDate), $lte: end };
    } else if (startDate) {
      dateQuery = { $gte: new Date(startDate) };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery = { $lte: end };
    }

    // Build filters for Orders
    const orderFilter = {};
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") orderFilter.status = { $in: ["paid"] };
      else if (normalizedStatus === "failed") orderFilter.status = { $in: ["failed"] };
      else orderFilter.status = { $in: ["created"] };
    }
    if (dateQuery) orderFilter.createdAt = dateQuery;
    
    // Build filters for Payouts
    const payoutFilter = {};
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") payoutFilter.status = { $in: ["paid"] };
      else if (normalizedStatus === "failed") payoutFilter.status = { $in: ["rejected"] };
      else payoutFilter.status = { $in: ["pending", "processing"] };
    }
    if (dateQuery) payoutFilter.createdAt = dateQuery;

    let orders = [];
    let payouts = [];

    // Fetch Orders if type is 'all' or 'buyer_to_admin'
    if (normalizedType === "all" || normalizedType === "buyer_to_admin") {
      const query = { ...orderFilter };

      if (userId) {
        if (scopedUser.role === "buyer") {
          query.buyerId = userId;
        } else if (scopedUser.role === "seller") {
          query.sellerId = userId;
        }
      }

      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: "i" } },
          { razorpayOrderId: { $regex: search, $options: "i" } },
          { orderId: { $regex: search, $options: "i" } }
        ];
      }
      orders = await Order.find(query)
        .populate("buyerId", "name email")
        .populate("productId", "title")
        .sort({ createdAt: -1 });
    }

    // Fetch Payouts if type is 'all' or 'admin_to_seller'
    if ((normalizedType === "all" || normalizedType === "admin_to_seller") && scopedUser?.role !== "buyer") {
      const query = { ...payoutFilter };

      if (userId && scopedUser?.role === "seller") {
        query.sellerId = userId;
      }

      if (search) {
        query.$or = [
          { paymentReference: { $regex: search, $options: "i" } },
          { rejectionReason: { $regex: search, $options: "i" } }
        ];
      }
      payouts = await Payout.find(query)
        .populate("sellerId", "name email")
        .sort({ createdAt: -1 });
    }

    // Format and Combine
    const buyerTransactions = orders.map(order => ({
      _id: order._id,
      type: "buyer_to_admin",
      orderId: order.razorpayOrderId || order._id.toString(),
      buyerName: order.buyerId?.name || "Unknown",
      buyerEmail: order.buyerId?.email || "Unknown",
      productName: order.productName || order.productId?.title || "Unknown Product",
      amount: order.amount || 0,
      status: order.status === "paid" ? "success" : order.status === "failed" ? "failed" : "pending",
      date: order.createdAt,
      createdAt: order.createdAt,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentMethod: "razorpay"
    }));

    const sellerTransactions = payouts.map(payout => ({
      _id: payout._id,
      type: "admin_to_seller",
      orderId: payout._id.toString(),
      sellerName: payout.sellerId?.name || "Unknown",
      sellerEmail: payout.sellerId?.email || "Unknown",
      productName: "Seller Payout",
      amount: payout.netPayableAmount || payout.amount || 0,
      status: payout.status === "paid" ? "success" : payout.status === "rejected" ? "failed" : "pending",
      date: payout.paidAt || payout.createdAt,
      createdAt: payout.paidAt || payout.createdAt,
      paymentMethod: payout.paymentMethod || "manual",
      paymentReference: payout.paymentReference,
      errorReason: payout.rejectionReason
    }));

    let allTransactions = [...buyerTransactions, ...sellerTransactions];

    // Apply normalized UI filters after combining both collections so the
    // table always matches the dropdown values, even if source statuses differ.
    if (normalizedType !== "all") {
      allTransactions = allTransactions.filter((t) => t.type === normalizedType);
    }

    if (normalizedStatus !== "all") {
      allTransactions = allTransactions.filter((t) => t.status === normalizedStatus);
    }

    // Final search filter for user names/emails (after formatting/populating)
    if (search) {
      const s = search.toLowerCase();
      allTransactions = allTransactions.filter(t => 
        (t.buyerName?.toLowerCase().includes(s)) ||
        (t.buyerEmail?.toLowerCase().includes(s)) ||
        (t.sellerName?.toLowerCase().includes(s)) ||
        (t.sellerEmail?.toLowerCase().includes(s)) ||
        (t.productName?.toLowerCase().includes(s)) ||
        (t.orderId?.toLowerCase().includes(s))
      );
    }

    // Sorting
    allTransactions.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      return new Date(b.date) - new Date(a.date);
    });

    const total = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + parseInt(limit));
    const successTransactions = allTransactions.filter((t) => t.status === "success");
    const pendingTransactions = allTransactions.filter((t) => t.status === "pending");
    const failedTransactions = allTransactions.filter((t) => t.status === "failed");

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        total: {
          count: total,
          amount: allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        },
        success: {
          count: successTransactions.length,
          amount: successTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        },
        pending: {
          count: pendingTransactions.length,
          amount: pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        },
        failed: {
          count: failedTransactions.length,
          amount: failedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        },
        buyerPayments: buyerTransactions.length,
        sellerPayouts: sellerTransactions.length,
        successCount: successTransactions.length,
        failedCount: failedTransactions.length,
        totalAmount: successTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    });
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// Bulk mark transactions as reviewed by admin
export const bulkMarkTransactionsReviewed = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Valid array of IDs is required" });
    }

    const updateQuery = { 
      reviewedByAdmin: true, 
      reviewedAt: new Date() 
    };

    // Update both Order and Payout collections because transactions can be from either
    await Promise.all([
      Order.updateMany({ _id: { $in: ids } }, { $set: updateQuery }),
      Payout.updateMany({ _id: { $in: ids } }, { $set: updateQuery })
    ]);

    res.json({ message: "Transactions marked as reviewed successfully" });
  } catch (error) {
    console.error("Error marking transactions as reviewed:", error);
    res.status(500).json({ message: "Failed to mark transactions as reviewed" });
  }
};

// ==================== Trust & Security Features ====================

/**
 * Get products flagged by malware scans
 * Returns products with malware detections from VirusTotal
 */
export const getMalwareFlaggedProducts = async (req, res) => {
  try {
    const { severity } = req.query; // 'all', 'high', 'medium', 'low'
    
    // Find products with malware detections
    const query = {
      $or: [
        { "malwareScanDetails.detections.malicious": { $gt: 0 } },
        { "malwareScanDetails.detections.suspicious": { $gt: 0 } }
      ]
    };
    
    const products = await Product.find(query)
      .populate("sellerId", "name email totalSales averageRating")
      .sort({ createdAt: -1 });
    
    // Calculate severity for each product
    const flaggedProducts = products.map(product => {
      const detections = product.malwareScanDetails?.detections || {};
      const malicious = detections.malicious || 0;
      const suspicious = detections.suspicious || 0;
      
      let severityLevel = 'low';
      if (malicious > 5) severityLevel = 'high';
      else if (malicious > 0 || suspicious > 10) severityLevel = 'medium';
      
      return {
        ...product.toObject(),
        severityLevel,
        threatScore: malicious * 10 + suspicious * 2
      };
    });
    
    // Filter by severity if requested
    const filtered = severity && severity !== 'all'
      ? flaggedProducts.filter(p => p.severityLevel === severity)
      : flaggedProducts;
    
    res.json({
      products: filtered,
      summary: {
        total: filtered.length,
        high: flaggedProducts.filter(p => p.severityLevel === 'high').length,
        medium: flaggedProducts.filter(p => p.severityLevel === 'medium').length,
        low: flaggedProducts.filter(p => p.severityLevel === 'low').length
      }
    });
  } catch (error) {
    console.error("Error fetching malware flagged products:", error);
    res.status(500).json({ message: "Failed to fetch malware flagged products" });
  }
};

/**
 * Get malware scan dashboard statistics
 */
export const getMalwareStats = async (req, res) => {
  try {
    const totalScans = await Product.countDocuments({ scanStatus: { $ne: "PENDING" } });
    const productsWithDetections = await Product.countDocuments({
      scanStatus: { $in: ["FLAGGED", "MALICIOUS"] }
    });
    const cleanProducts = await Product.countDocuments({ scanStatus: "CLEAN" });
    const basicCheckOnly = await Product.countDocuments({
      "malwareScanDetails.basicCheckOnly": true
    });
    const recentScans = await Product.countDocuments({
      scanStatus: { $ne: "PENDING" },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalScans,
      productsWithDetections,
      cleanProducts,
      basicCheckOnly,
      recentScans,
      scanRate: totalScans > 0 ? ((cleanProducts / totalScans) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    console.error("Error fetching malware stats:", error);
    res.status(500).json({ message: "Failed to fetch malware stats" });
  }
};

export const getMalwareScans = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const query = { scanStatus: { $ne: "PENDING" } };
    
    if (cursor) {
      const { createdAt, id } = JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'));
      query.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: id } }
      ];
    }

    const scans = await Product.find(query)
      .populate("sellerId", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .limit(Number(limit))
      .select("title scanStatus virusTotalLink malwareScanDetails sellerId createdAt malwareScanDate");
      
    let nextCursor = null;
    if (scans.length === Number(limit)) {
      const lastScan = scans[scans.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ 
        createdAt: lastScan.createdAt.toISOString(), 
        id: lastScan._id.toString() 
      })).toString('base64');
    }
    
    const totalCount = await Product.countDocuments({ scanStatus: { $ne: "PENDING" } });

    res.json({
      scans,
      nextCursor,
      totalCount
    });
  } catch (error) {
    console.error("Error fetching malware scans:", error);
    res.status(500).json({ message: "Failed to fetch malware scans" });
  }
};

export const getMalwareScanDetails = async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // Explicit whitelist of allowed VT fields to prevent evasion
    const scan = await Product.findById(scanId)
      .populate("sellerId", "name email")
      .select("title scanStatus scanLockedAt virusTotalLink malwareScanDate createdAt");
      
    if (!scan) return res.status(404).json({ message: "Scan not found" });

    // Assuming we need malwareScanDetails separately to sanitize it
    const productData = await Product.findById(scanId).select("malwareScanDetails");
    
    let sanitizedDetails = null;
    if (productData?.malwareScanDetails) {
      const dets = productData.malwareScanDetails.detections || {};
      const totalEngines = (dets.malicious || 0) + (dets.suspicious || 0) + (dets.harmless || 0) + (dets.undetected || 0);
      
      sanitizedDetails = {
        scan_date: scan.malwareScanDate,
        total_engines: totalEngines,
        malicious_count: dets.malicious || 0,
        suspicious_count: dets.suspicious || 0,
        harmless_count: productData.malwareScanDetails.detections?.harmless || 0,
        undetected_count: productData.malwareScanDetails.detections?.undetected || 0,
        threat_category: productData.malwareScanDetails.threat_category,
        basicCheckOnly: productData.malwareScanDetails.basicCheckOnly
      };
    }

    res.json({
      ...scan.toObject(),
      malwareScanDetails: sanitizedDetails
    });
  } catch (error) {
    console.error("Error fetching malware scan details:", error);
    res.status(500).json({ message: "Failed to fetch malware scan details" });
  }
};

/**
 * Step 1: Whitelist a malware scan
 */
export const whitelistMalwareScan = async (req, res) => {
  const { scanId } = req.params;
  const adminId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const scan = await Product.findById(scanId).session(session);
    if (!scan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Scan not found" });
    }

    scan.scanStatus = 'MANUALLY_REVIEWED';
    await scan.save({ session });

    await ModerationLog.create([{
      action: 'scan_whitelisted',
      targetId: scanId,
      adminId,
      timestamp: new Date()
    }], { session });
    
    await session.commitTransaction();
    res.json({ message: "Scan whitelisted successfully", scanStatus: 'MANUALLY_REVIEWED' });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error whitelisting scan:", err);
    res.status(500).json({ message: "Failed to whitelist scan" });
  } finally {
    session.endSession();
  }
};

/**
 * Step 2: Notify seller about threat
 */
export const notifySellerThreat = async (req, res) => {
  const { scanId } = req.params;
  const adminId = req.user._id;

  try {
    const alreadyNotified = await ModerationLog.findOne({
      targetId: scanId,
      action: 'scan_seller_notified'
    });
    
    if (alreadyNotified) {
      return res.status(409).json({ message: 'Seller already notified' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let product;
    try {
      product = await Product.findById(scanId).populate("sellerId").session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Product not found" });
      }

      await ModerationLog.create([{
        action: 'scan_seller_notified',
        targetId: scanId,
        adminId,
        timestamp: new Date()
      }], { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    // Outside transaction
    await sendThreatNotificationEmail(product.sellerId, product, "Please review the security report and upload a safe version.");
    
    res.json({ message: "Seller notified successfully" });
  } catch (error) {
    console.error("Error notifying seller:", error);
    res.status(500).json({ message: "Failed to notify seller" });
  }
};

/**
 * Step 3: Remove malicious product
 */
export const takedownMaliciousProduct = async (req, res) => {
  const { scanId } = req.params;
  const adminId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(scanId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Update product status
    product.status = 'rejected'; // Or maybe 'deleted', but rejected unpublishes it usually
    product.scanStatus = 'MANUALLY_REVIEWED'; // To stop it appearing in urgent queues
    await product.save({ session });

    // 2. Write ModerationLog
    await ModerationLog.create([{
      action: 'scan_product_removed',
      targetId: scanId,
      adminId,
      timestamp: new Date()
    }], { session });

    // 3. Cancel pending/processing orders
    await Order.updateMany(
      { productId: scanId, status: { $in: ['pending', 'processing'] } },
      { $set: { status: 'cancelled' } },
      { session }
    );

    // 4. Commit
    await session.commitTransaction();
    
    // 5/6: Notify/Refund logic would go here asynchronously
    // fireAndForgetRefunds(scanId);

    res.json({ message: "Product removed successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error removing product:", err);
    res.status(500).json({ message: "Failed to remove product" });
  } finally {
    session.endSession();
  }
};

/**
 * Step 4: Force Re-scan
 */
export const rescanMalware = async (req, res) => {
  const { scanId } = req.params;
  
  try {
    // 1. Atomic DB lock
    const lock = await Product.findOneAndUpdate(
      { 
        _id: scanId, 
        scanStatus: { $nin: ['SCANNING'] }
      },
      { 
        $set: { 
          scanStatus: 'SCANNING', 
          scanLockedAt: new Date() 
        } 
      },
      { new: true }
    );

    if (!lock) {
      return res.status(409).json({ message: 'Scan already in progress' });
    }

    // 2. Return 202 immediately
    res.status(202).json({ message: "Re-scan started", scanStatus: "SCANNING" });

    // 3. Background job
    (async () => {
      try {
        if (!lock.virusTotalId) {
          throw new Error("No virusTotalId present for this product to re-scan.");
        }

        let fileHashForVT = lock.virusTotalId;
        try {
          // If it's a base64 encoded Analysis ID, extract the hash. e.g. "NzQzYWE..." -> "743aa33c...:1778324192"
          const decoded = Buffer.from(lock.virusTotalId, 'base64').toString('utf-8');
          if (decoded.includes(':')) {
            fileHashForVT = decoded.split(':')[0];
          }
        } catch (e) {
          // Leave as is if it can't be parsed
        }

        // Step 1: Trigger re-analysis
        const reanalysis = await fetch(
          `https://www.virustotal.com/api/v3/files/${fileHashForVT}/analyse`,
          { method: 'POST', headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY } }
        );
        const reanalysisResult = await reanalysis.json();
        
        let stats = null;
        let scanDate = new Date();

        if (reanalysisResult.error || !reanalysisResult.data) {
          console.warn(`VT API POST /analyse Error: ${reanalysisResult.error?.message}. Falling back to GET /files/{id}.`);
          // Fallback: Just get the current file report
          const fileReport = await fetch(
            `https://www.virustotal.com/api/v3/files/${fileHashForVT}`,
            { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY } }
          );
          const fileData = await fileReport.json();
          if (fileData.error || !fileData.data) {
             throw new Error(`VT API GET /files Error: ${fileData.error?.message || 'Unknown error'}`);
          }
          stats = fileData.data.attributes.last_analysis_stats;
          scanDate = new Date(fileData.data.attributes.last_analysis_date * 1000 || Date.now());
        } else {
          const analysisId = reanalysisResult.data.id;

          // Step 2: Poll until completed
          let attempts = 0;
          const MAX_ATTEMPTS = 30; // 30 attempts = 7.5 minutes
          const POLL_INTERVAL = 15000; // 15 seconds

          const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

          while (attempts < MAX_ATTEMPTS && !stats) {
            await sleep(POLL_INTERVAL);
            
            const result = await fetch(
              `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
              { headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY } }
            );
            const analysis = await result.json();

            if (analysis.data && analysis.data.attributes && analysis.data.attributes.status === 'completed') {
              stats = analysis.data.attributes.stats;
              scanDate = new Date(analysis.data.attributes.date * 1000 || Date.now());
              break;
            }

            attempts++;
          }
        }

        if (stats) {
          // NOW store the real results
          await Product.findByIdAndUpdate(scanId, {
            $set: {
              scanStatus: stats.malicious > 0 ? 'MALICIOUS' : 'CLEAN',
              'malwareScanDetails.detections.malicious': stats.malicious || 0,
              'malwareScanDetails.detections.suspicious': stats.suspicious || 0,
              'malwareScanDetails.detections.harmless': stats.harmless || 0,
              'malwareScanDetails.detections.undetected': stats.undetected || 0,
              malwareScanDate: scanDate,
              scanLockedAt: null
            }
          });
          return;
        }

        // Max attempts exceeded — mark as failed
        await Product.findByIdAndUpdate(scanId, {
          $set: { scanStatus: 'SCAN_FAILED', scanLockedAt: null }
        });

      } catch (bgError) {
        console.error("Background rescan failed:", bgError);
        await Product.updateOne(
          { _id: scanId },
          { $set: { scanStatus: 'SCAN_FAILED', scanLockedAt: null } }
        );
      }
    })();
    
  } catch (error) {
    console.error("Error starting rescan:", error);
    res.status(500).json({ message: "Failed to start re-scan" });
  }
};

/**
 * Get products requiring manual content review
 * Returns products flagged by automatic content review heuristics
 */
export const getContentReviewQueue = async (req, res) => {
  try {
    const { severity, cursor, limit = 75 } = req.query; // 'all', 'high', 'medium', 'low'
    
    const query = {
      requiresManualReview: true,
      status: { $ne: 'rejected' }, // Exclude already rejected
      reviewedAt: null // Exclude already manually reviewed items
    };
    
    // Calculate summary across all unreviewed flagged products
    const [summaryResult] = await Product.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        high: { $sum: { $cond: [{ $eq: ["$reviewSeverity", "high"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$reviewSeverity", "medium"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$reviewSeverity", "low"] }, 1, 0] } }
      }}
    ]);
    const summary = summaryResult || { total: 0, high: 0, medium: 0, low: 0 };
    
    // Apply filters for the list
    if (severity && severity !== 'all') {
      query.reviewSeverity = severity;
    }
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const limitNum = parseInt(limit) || 75;
    
    const products = await Product.find(query)
      .populate("sellerId", "name email totalSales averageRating identityVerified")
      .sort({ _id: -1 })
      .limit(limitNum);
      
    const nextCursor = products.length === limitNum ? products[products.length - 1]._id : null;
    
    res.json({
      products,
      summary,
      nextCursor
    });
  } catch (error) {
    console.error("Error fetching content review queue:", error);
    res.status(500).json({ message: "Failed to fetch content review queue" });
  }
};

/**
 * Resolve a content review flag (approve or keep rejected)
 */
export const resolveContentReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    if (action === 'approve') {
      // Clear review flag and approve product
      product.requiresManualReview = false;
      product.reviewFlags = [];
      product.reviewSeverity = null;
      product.contentQualityScore = Math.max(product.contentQualityScore || 0, 60); // Boost score
      product.status = 'approved';
      product.rejectionReason = null;
      
      await product.save();
      
      // Notify seller
      if (product.sellerId) {
        await createNotification(
          product.sellerId,
          'product_approved',
          'Content Review Passed ',
          `Your product "${product.title}" has been manually reviewed and approved by our team.`,
          product._id,
          'Product'
        );
      }
      
      res.json({ 
        message: "Product approved after manual review", 
        product 
      });
    } else {
      // Reject product
      const rejectionReason = reason || 'Failed manual content review';
      
      product.status = 'rejected';
      product.rejectionReason = rejectionReason;
      
      await product.save();
      
      // Notify seller
      if (product.sellerId) {
        await createNotification(
          product.sellerId,
          'product_rejected',
          'Product Rejected After Review',
          `Your product "${product.title}" was rejected after manual review. Reason: ${rejectionReason}`,
          product._id,
          'Product'
        );
      }
      
      res.json({ 
        message: "Product rejected after manual review", 
        product,
        reason: rejectionReason
      });
    }
  } catch (error) {
    console.error("Error resolving content review:", error);
    res.status(500).json({ message: "Failed to resolve content review" });
  }
};

// Get moderation logs
export const getModerationLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      productId,
      adminId,
      action,
      from,
      to,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (productId) query.productId = productId;
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const logs = await ModerationLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await ModerationLog.countDocuments(query);

    res.json({
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching moderation logs:", error);
    res.status(500).json({ message: "Failed to fetch moderation logs" });
  }
};

/**
 * Verify seller identity
 * Updates seller's identityVerificationStatus and tracks submission history
 */
export const verifySellerIdentity = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { verified, notes } = req.body; // verified: boolean, notes: string (rejection reason)
    
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    if (seller.role !== 'seller') {
      return res.status(400).json({ message: "User is not a seller" });
    }
    
    seller.identityVerificationStatus = verified ? 'verified' : 'rejected';
    
    if (verified) {
      seller.latestRejectionReason = undefined;
      seller.latestRejectionAt = undefined;
    } else {
      seller.latestRejectionReason = notes;
      seller.latestRejectionAt = new Date();
    }

    // Update current submission round status
    if (seller.identityDocuments && seller.identityDocuments.length > 0) {
      const highestRound = Math.max(...seller.identityDocuments.map(d => d.submissionRound || 1));
      seller.identityDocuments.forEach(doc => {
        if (doc.submissionRound === highestRound) {
          doc.status = verified ? 'approved' : 'rejected';
          doc.reviewedAt = new Date();
          doc.reviewedBy = req.user._id;
          if (!verified) doc.rejectionReason = notes;
        }
      });
    }
    
    await seller.save();
    
    // Notify seller
    await createNotification(
      seller._id,
      verified ? 'identity_verified' : 'identity_rejected',
      verified ? 'Identity Verified ' : 'Identity Verification Issue',
      verified
        ? 'Your identity has been verified! This badge will help build trust with buyers.'
        : `There was an issue with your identity verification. ${notes || 'Please fix the issues and try again.'}`,
      seller._id,
      'User'
    );
    
    res.json({
      message: verified ? "Seller identity verified" : "Seller identity verification rejected",
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        identityVerificationStatus: seller.identityVerificationStatus
      }
    });
  } catch (error) {
    console.error("Error verifying seller identity:", error);
    res.status(500).json({ message: "Failed to verify seller identity" });
  }
};

/**
 * Get sellers pending identity verification
 */
export const getPendingIdentityVerifications = async (req, res) => {
  try {
    const { cursor, limit = 75 } = req.query;
    
    const query = {
      role: 'seller',
      identityVerificationStatus: 'pending'
    };
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const limitNum = parseInt(limit) || 75;

    const sellers = await User.find(query)
      .select('-password')
      .sort({ _id: -1 })
      .limit(limitNum);
      
    const nextCursor = sellers.length === limitNum ? sellers[sellers.length - 1]._id : null;
    
    res.json({
      sellers,
      nextCursor
    });
  } catch (error) {
    console.error("Error fetching pending identity verifications:", error);
    res.status(500).json({ message: "Failed to fetch pending identity verifications" });
  }
};

/**
 * Generate a signed URL for an admin to view a private identity document
 */
export const viewIdentityDocument = async (req, res) => {
  try {
    const { publicId } = req.query;
    
    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }

    // Find the document in the DB to extract its format and resource_type
    const user = await User.findOne({ "identityDocuments.public_id": publicId });
    if (!user) {
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = user.identityDocuments.find(d => d.public_id === publicId);
    
    let resourceType = 'image';
    if (doc.url && doc.url.includes('/raw/')) resourceType = 'raw';
    else if (doc.url && doc.url.includes('/video/')) resourceType = 'video';

    const match = doc.url ? doc.url.match(/\.([a-z0-9]+)$/i) : null;
    const format = match ? match[1] : '';

    const signedUrl = cloudinary.utils.private_download_url(
      publicId, 
      format,
      { 
        expires_at: Math.floor(Date.now() / 1000) + 300, 
        resource_type: resourceType,
        type: 'authenticated'
      } 
    );
    
    // Proxy the fetch through our server so the Cloudinary URL never reaches the browser
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Cloudinary returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="document.${format || 'bin'}"`);
    res.send(buffer);

  } catch (error) {
    console.error("Error generating document proxy:", error);
    res.status(500).json({ message: "Failed to fetch document" });
  }
};

export const getPayoutAnalytics = async (req, res) => {
  try {
    const { range = "30" } = req.query;
    const days = parseInt(range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [statsResult] = await Payout.aggregate([
      {
        $group: {
          _id: null,
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          pendingValue: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] } },
          paidThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "paid"] }, { $gte: ["$processedAt", startOfMonth] }] }, 1, 0] } },
          rejectedThisMonth: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "rejected"] }, { $gte: ["$processedAt", startOfMonth] }] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsResult || {
      pendingCount: 0,
      pendingValue: 0,
      paidThisMonth: 0,
      rejectedThisMonth: 0
    };

    const volumeDataRaw = await Payout.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const volumeData = [];
    const currDate = new Date(startDate);
    const endDate = new Date();
    while (currDate <= endDate) {
      const dateStr = currDate.toISOString().split('T')[0];
      const found = volumeDataRaw.find(d => d._id === dateStr);
      volumeData.push({
        date: dateStr,
        amount: found ? found.amount : 0,
        count: found ? found.count : 0
      });
      currDate.setDate(currDate.getDate() + 1);
    }

    const statusDataRaw = await Payout.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 }
        }
      }
    ]);
    
    const statuses = ["pending", "paid", "rejected"];
    const statusData = statuses.map(s => {
      const found = statusDataRaw.find(d => d._id === s);
      return {
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: found ? found.value : 0,
        color: s === 'pending' ? '#f59e0b' : s === 'paid' ? '#10b981' : '#ef4444'
      };
    });

    const needsAttentionRaw = await Payout.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate("sellerId", "name email");

    const needsAttention = needsAttentionRaw.map(p => ({
      id: p._id,
      sellerName: p.sellerId?.name || "Unknown Seller",
      amount: p.amount,
      createdAt: p.createdAt,
      daysOpen: Math.floor((new Date() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      stats: {
        pendingPayouts: stats.pendingCount,
        pendingValue: stats.pendingValue,
        paidThisMonth: stats.paidThisMonth,
        rejectedThisMonth: stats.rejectedThisMonth
      },
      volumeData,
      statusData,
      needsAttention
    });
  } catch (error) {
    console.error("Error fetching payout analytics:", error);
    res.status(500).json({ message: "Failed to fetch payout analytics" });
  }
};
