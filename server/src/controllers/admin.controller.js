
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
      'product_approved',
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
      'product_rejected',
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

// Get all products with different statuses
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });
    res.json(products);
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
    
    // Delete files from Cloudinary
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
    
    // Delete product from database
    await Product.findByIdAndDelete(id);
    
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
      message: "Product deleted successfully",
      deletedProduct: {
        id,
        title: productTitle,
        reason: String(deleteReason).trim()
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
        "Product Update Approved ✅",
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
      // Delete the product
      // First delete files from Cloudinary
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

      // Notify seller about deletion approval
      await createNotification(
        product.sellerId,
        "product_change_approved",
        "Product Deletion Approved ✅",
        `Your product "${product.title}" has been deleted as requested`,
        product._id,
        "Product"
      );

      return res.json({ message: "Product deletion approved and product removed" });
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
    const formattedPayouts = payouts.map(payout => {
      const seller = payout.sellerId;
      const primaryAccount = seller.bankAccounts?.find(acc => acc.isPrimary);

      return {
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
    );

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
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

// Get all payouts with filters (for admin dashboard)
export const getAllPayouts = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;

    const payouts = await Payout.find(filter)
      .populate("sellerId", "name email")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Payout.countDocuments(filter);

    res.json({
      payouts,
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
  const disputes = await Dispute.find({ status: "open" })
    .populate("orderId")
    .populate("buyerId", "email");

  res.json(disputes);
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
    
    // Get total products (approved products)
    const totalProducts = await Product.countDocuments({ status: "approved" });

    // Get recent transactions (last 10)
    const recentTransactions = await Order.find({ status: "paid" })
      .populate("buyerId", "name email")
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Format transactions
    const formattedTransactions = recentTransactions.map(order => ({
      id: order._id,
      orderId: order.razorpayOrderId || order._id,
      user: order.buyerId?.name || "Unknown",
      userEmail: order.buyerId?.email,
      productName: order.productId?.name || "Unknown Product",
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

// Approve seller account deletion
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

    // Notify seller about approval before deletion
    try {
      await createNotification(
        seller._id,
        'seller_deletion_approved',
        'Account Deletion Approved',
        `Your account deletion request has been approved. Your account will be removed shortly.`,
        seller._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying seller about deletion approval:", notifyErr);
    }

    // Delete the seller account
    await User.findByIdAndDelete(id);

    res.json({ message: "Seller account deleted successfully" });
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

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password -deletionOTP -deletionOTPExpire").sort({ createdAt: -1 });
    res.json(users);
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

// Delete user by admin with reason
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ message: "Deletion reason is required (min 5 characters)" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    // Create notification for user before deletion
    try {
      await createNotification(
        user._id,
        'account_deleted_by_admin',
        'Account Deleted by Administrator',
        `Your account has been deleted by an administrator. Reason: ${String(reason).trim()}`,
        user._id,
        'User'
      );
    } catch (notifyErr) {
      console.error("Error notifying user about account deletion:", notifyErr);
    }

    // Delete user's notifications
    await Notification.deleteMany({ userId: user._id });

    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({ message: "User account deleted successfully", deletedUser: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Get all transactions (buyer payments + seller payouts)
export const getAllTransactions = async (req, res) => {
  try {
    // Get all buyer payments (orders)
    const orders = await Order.find()
      .populate("buyerId", "name email")
      .populate("productId", "title")
      .sort({ createdAt: -1 });

    // Get all seller payouts
    const payouts = await Payout.find()
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    // Format buyer to admin transactions
    const buyerTransactions = orders.map(order => ({
      _id: order._id,
      type: "buyer_to_admin",
      orderId: order.razorpayOrderId || order._id.toString(),
      buyerName: order.buyerId?.name || "Unknown",
      buyerEmail: order.buyerId?.email || "Unknown",
      productName: order.productId?.title || "Unknown Product",
      amount: order.amount || 0,
      status: order.status === "paid" ? "success" : order.status === "failed" ? "failed" : "pending",
      date: order.createdAt,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentMethod: "razorpay"
    }));

    // Format admin to seller transactions (payouts)
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
      paymentMethod: payout.paymentMethod || "manual",
      paymentReference: payout.paymentReference,
      errorReason: payout.rejectionReason
    }));

    // Combine and sort by date
    const allTransactions = [...buyerTransactions, ...sellerTransactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({
      transactions: allTransactions,
      summary: {
        total: allTransactions.length,
        buyerPayments: buyerTransactions.length,
        sellerPayouts: sellerTransactions.length,
        successCount: allTransactions.filter(t => t.status === "success").length,
        failedCount: allTransactions.filter(t => t.status === "failed").length,
        totalAmount: allTransactions.filter(t => t.status === "success").reduce((sum, t) => sum + t.amount, 0)
      }
    });
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};