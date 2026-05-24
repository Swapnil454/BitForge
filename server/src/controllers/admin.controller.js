
import User from "../models/User.js";
import Product from "../models/Product.js";
import Payout from "../models/Payout.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "./notification.controller.js";
// import razorpayX from "../config/razorpayx.js"; // Temporarily disabled for manual payouts
import Dispute from "../models/Dispute.js";
import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import PDFDocument from 'pdfkit';

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
  const products = await Product.find({ status: "pending" })
    .populate("sellerId", "name email");
  res.json(products);
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
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
};

// Get advanced product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const approved = await Product.countDocuments({ status: "approved" });
    const pending = await Product.countDocuments({ status: "pending" });
    const rejected = await Product.countDocuments({ status: "rejected" });

    // Category breakdown
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top sellers by product count
    const topSellers = await Product.aggregate([
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller"
        }
      },
      { $unwind: "$seller" },
      { $project: { name: "$seller.name", email: "$seller.email", count: 1 } }
    ]);

    // Recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubmissions = await Product.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      stats: { 
        total: totalProducts, 
        approved, 
        pending, 
        rejected,
        recentSubmissions
      },
      categories,
      topSellers
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

// Approve product
export const approveProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(id, {
    status: "approved",
    rejectionReason: null,
  }, { new: true });

  // Notify seller about product approval
  if (product && product.sellerId) {
    await createNotification(
      product.sellerId,
      "product_approved",
      "Product Approved! 🎉",
      `Your product "${product.title}" has been approved and is now live on the marketplace`,
      product._id,
      "Product"
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
        "Product"
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
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: "Rejection reason required" });
  }

  const product = await Product.findByIdAndUpdate(id, {
    status: "rejected",
    rejectionReason: reason,
  }, { new: true });

  // Notify seller about product rejection
  if (product && product.sellerId) {
    await createNotification(
      product.sellerId,
      "product_rejected",
      "Product Rejected",
      `Your product "${product.title}" was rejected. Reason: ${reason}`,
      product._id,
      "Product"
    );
  }

  res.json({ message: "Product rejected" });
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
        "Product"
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
            "Product"
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
        "Product"
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
      "Product"
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

export const approvePayout = async (req, res) => {
  try {
    const { paymentReference, paymentNotes, paymentMethod = "manual" } = req.body;
    
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
    payout.paidBy = req.user.id; // Admin who processed the payment
    payout.paidAt = new Date();
    payout.paymentMethod = paymentMethod;
      payout.paymentReference = paymentReference; // UTR or transaction reference
      payout.paymentNotes = paymentNotes;
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
        paymentReference,
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
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }
    
      const payout = await Payout.findByIdAndUpdate(
        req.params.id,
        {
          status: "rejected",
          rejectionReason: reason,
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
          `Your payout request was rejected. Reason: ${reason}`,
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
    const { status, limit = 100, page = 1 } = req.query;

    const filter = status && status !== 'all' ? { status } : {};
    const skip = (page - 1) * limit;

    const payouts = await Payout.find(filter)
      .populate("sellerId", "name email bankAccounts")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Payout.countDocuments(filter);

    const formattedPayouts = payouts.map(payout => {
      const seller = payout.sellerId;
      const primaryAccount = seller?.bankAccounts?.find(acc => acc.isPrimary);

      return {
        _id: payout._id,
        sellerId: seller ? {
          id: seller._id,
          name: seller.name || 'Unknown Seller',
          email: seller.email || 'N/A',
        } : null,
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
        paymentReference: payout.paymentReference,
        paymentNotes: payout.paymentNotes,
        paymentMethod: payout.paymentMethod,
        paidBy: payout.paidBy ? { name: payout.paidBy.name, email: payout.paidBy.email } : null,
        paidAt: payout.paidAt,
        rejectionReason: payout.rejectionReason,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      };
    });

    res.json({
      payouts: formattedPayouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
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

export const getOpenDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ status: "open" })
      .populate({
        path: "orderId",
        populate: [
          { path: "productId", select: "title" },
          { path: "buyerId", select: "name email" },
          { path: "sellerId", select: "name email" },
        ],
      })
      .populate("buyerId", "name email");

    const formattedDisputes = disputes.map((dispute) => {
      const order = dispute.orderId;
      const orderBuyer = order && order.buyerId;
      const orderSeller = order && order.sellerId;
      const product = order && order.productId;
      const fallbackBuyer = dispute.buyerId;

      const buyerName =
        (orderBuyer && (orderBuyer.name || orderBuyer.email)) ||
        (fallbackBuyer && (fallbackBuyer.name || fallbackBuyer.email)) ||
        "Unknown buyer";

      const sellerName =
        (orderSeller && (orderSeller.name || orderSeller.email)) ||
        "Unknown seller";

      const productName = (product && product.title) || "Product";

      const amount = order && typeof order.amount === "number" ? order.amount : 0;

      return {
        _id: dispute._id,
        orderId: order ? order._id : null,
        buyerName,
        sellerName,
        productName,
        amount,
        reason: dispute.reason,
        status: dispute.status,
        createdAt: dispute.createdAt,
      };
    });

    res.json({ disputes: formattedDisputes });
  } catch (error) {
    console.error("Error fetching open disputes:", error);
    res.status(500).json({ message: "Failed to load disputes" });
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

    // Calculate total commission earned
    const orders = await Order.find({ status: "paid" });
    const totalCommission = orders.reduce((sum, order) => sum + (order.platformFee || 0), 0);

    // Calculate total payouts made to sellers
    const payouts = await Payout.find({ status: { $in: ["approved", "paid"] } });
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);

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
        totalCommissionEarned: totalCommission,
        totalPayoutsMade: totalPayouts,
        netBalance: totalCommission - totalPayouts,
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
    
    // Get platform revenue (commission from all paid orders)
    const platformRevenue = orders.reduce((sum, order) => sum + (order.platformFee || 0), 0);

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
          revenue: { $sum: "$platformFee" },
          users: { $addToSet: "$buyerId" }
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
      revenue: item.revenue || 0,
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

    res.json({
      totalRevenue,
      platformRevenue,
      totalUsers,
      totalBuyers,
      totalSellers,
      totalProducts,
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
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let scopedUser = null;
    if (userId) {
      scopedUser = await User.findById(userId).select("role");
      if (!scopedUser) {
        return res.status(404).json({ message: "User not found" });
      }
    }
    
    // Build filters for Orders
    const orderFilter = {};
    if (status !== "all") {
      if (status === "success") orderFilter.status = "paid";
      else if (status === "failed") orderFilter.status = "failed";
      else orderFilter.status = "created";
    }
    
    // Build filters for Payouts
    const payoutFilter = {};
    if (status !== "all") {
      if (status === "success") payoutFilter.status = "paid";
      else if (status === "failed") payoutFilter.status = "rejected";
      else payoutFilter.status = "pending";
    }

    let orders = [];
    let payouts = [];

    // Fetch Orders if type is 'all' or 'buyer_to_admin'
    if (type === "all" || type === "buyer_to_admin") {
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
    if ((type === "all" || type === "admin_to_seller") && scopedUser?.role !== "buyer") {
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
export const getMalwareDashboardStats = async (req, res) => {
  try {
    // Total scans performed
    const totalScans = await Product.countDocuments({
      virusTotalId: { $exists: true }
    });
    
    // Products with detections
    const productsWithDetections = await Product.countDocuments({
      $or: [
        { "malwareScanDetails.detections.malicious": { $gt: 0 } },
        { "malwareScanDetails.detections.suspicious": { $gt: 0 } }
      ]
    });
    
    // Clean products
    const cleanProducts = await Product.countDocuments({
      virusTotalId: { $exists: true },
      "malwareScanDetails.detections.malicious": 0,
      "malwareScanDetails.detections.suspicious": 0
    });
    
    // Products with basic checks only (no VirusTotal)
    const basicCheckOnly = await Product.countDocuments({
      "malwareScanDetails.basicCheckOnly": true
    });
    
    // Recent scans (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentScans = await Product.countDocuments({
      virusTotalId: { $exists: true },
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get products with highest threat scores
    const highThreatProducts = await Product.find({
      "malwareScanDetails.detections.malicious": { $gt: 0 }
    })
      .populate("sellerId", "name email")
      .sort({ "malwareScanDetails.detections.malicious": -1 })
      .limit(10)
      .select("title virusTotalLink malwareScanDetails sellerId createdAt");
    
    res.json({
      totalScans,
      productsWithDetections,
      cleanProducts,
      basicCheckOnly,
      recentScans,
      scanRate: totalScans > 0 ? ((cleanProducts / totalScans) * 100).toFixed(1) : 0,
      highThreatProducts
    });
  } catch (error) {
    console.error("Error fetching malware dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch malware dashboard stats" });
  }
};

/**
 * Get products requiring manual content review
 * Returns products flagged by automatic content review heuristics
 */
export const getContentReviewQueue = async (req, res) => {
  try {
    const { severity } = req.query; // 'all', 'high', 'medium', 'low'
    
    const query = {
      requiresManualReview: true,
      status: { $ne: 'rejected' } // Exclude already rejected
    };
    
    if (severity && severity !== 'all') {
      query.reviewSeverity = severity;
    }
    
    const products = await Product.find(query)
      .populate("sellerId", "name email totalSales averageRating identityVerified")
      .sort({ createdAt: -1 });
    
    // Group by severity
    const grouped = {
      high: products.filter(p => p.reviewSeverity === 'high'),
      medium: products.filter(p => p.reviewSeverity === 'medium'),
      low: products.filter(p => p.reviewSeverity === 'low')
    };
    
    res.json({
      products,
      summary: {
        total: products.length,
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length
      },
      grouped
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

/**
 * Verify seller identity
 * Updates seller's identityVerified status and timestamp
 */
export const verifySellerIdentity = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { verified, notes } = req.body; // verified: boolean
    
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    if (seller.role !== 'seller') {
      return res.status(400).json({ message: "User is not a seller" });
    }
    
    seller.identityVerified = verified;
    seller.identityVerifiedAt = verified ? new Date() : null;
    seller.identityVerificationNotes = notes || '';
    
    await seller.save();
    
    // Notify seller
    await createNotification(
      seller._id,
      verified ? 'identity_verified' : 'identity_rejected',
      verified ? 'Identity Verified ' : 'Identity Verification Issue',
      verified
        ? 'Your identity has been verified! This badge will help build trust with buyers.'
        : `There was an issue with your identity verification. ${notes || 'Please contact support for details.'}`,
      seller._id,
      'User'
    );
    
    res.json({
      message: verified ? "Seller identity verified" : "Seller identity verification revoked",
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        identityVerified: seller.identityVerified,
        identityVerifiedAt: seller.identityVerifiedAt
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
    // Find sellers who haven't been verified yet but have submitted documents
    // For now, get all sellers who are approved but not identity verified
    const sellers = await User.find({
      role: 'seller',
      approvalStatus: 'approved',
      identityVerified: { $ne: true }
    })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(sellers);
  } catch (error) {
    console.error("Error fetching pending identity verifications:", error);
    res.status(500).json({ message: "Failed to fetch pending identity verifications" });
  }
};
