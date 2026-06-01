


import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import PromotionRequest from "../models/PromotionRequest.js";
import Review from "../models/Review.js";
import { sendPayoutRequestAdminEmail } from "../utils/moderationEmails.js";

export const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // All paid orders for this seller
    const orders = await Order.find({ sellerId, status: "paid" })
      .populate({ path: "productId", select: "title price thumbnail" })
      .sort({ createdAt: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
    const totalSales = orders.length;

    const thisMonthRevenue = orders
      .filter(o => o.createdAt >= startOfMonth)
      .reduce((sum, o) => sum + (o.sellerAmount || 0), 0);

    const lastMonthRevenue = orders
      .filter(o => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth)
      .reduce((sum, o) => sum + (o.sellerAmount || 0), 0);

    const revenueGrowth = lastMonthRevenue === 0
      ? (thisMonthRevenue > 0 ? 100 : 0)
      : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // Build last 6 months sales/revenue
    const monthlyMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap.set(key, { month: d.toLocaleString("default", { month: "short" }), revenue: 0, sales: 0 });
    }

    orders.forEach(o => {
      const d = o.createdAt;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key);
        entry.revenue += o.sellerAmount || 0;
        entry.sales += 1;
        monthlyMap.set(key, entry);
      }
    });

    const monthly = Array.from(monthlyMap.values());

    // Recent sales (last 5)
    const recentSales = orders.slice(0, 5).map(o => ({
      id: o._id,
      productName: o.productId?.title || "Product",
      amount: o.sellerAmount || 0,
      createdAt: o.createdAt,
    }));

    res.json({
      totalRevenue,
      thisMonthRevenue,
      totalSales,
      revenueGrowth,
      conversion: null, // not enough data to compute (no traffic metrics)
      monthly,
      recentSales,
    });
  } catch (error) {
    console.error("Error fetching seller dashboard stats", error);
    res.status(500).json({ message: "Failed to fetch seller dashboard stats" });
  }
};

export const getSellerEarnings = async (req, res) => {
  const sellerId = req.user.id;

  const orders = await Order.find({
    sellerId,
    status: "paid",
  });

  const totalEarnings = orders.reduce(
    (sum, o) => sum + o.sellerAmount,
    0
  );

  const payouts = await Payout.find({
    sellerId,
    status: { $in: ["processing", "paid"] },
  });

  const withdrawn = payouts.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Calculate pending withdrawals
  const pendingPayouts = await Payout.find({
    sellerId,
    status: "pending",
  }).sort({ createdAt: -1 });

  const pendingAmount = pendingPayouts.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Get payout history
  const payoutHistory = await Payout.find({
    sellerId,
    status: { $in: ["paid", "rejected"] }
  }).sort({ createdAt: -1 });

  const user = await User.findById(sellerId).select('bankAccounts');
  const primaryAccount = user?.bankAccounts?.find(acc => acc.isPrimary) || user?.bankAccounts?.[0] || null;

  res.json({
    totalEarnings,
    withdrawn,
    pendingWithdrawals: pendingAmount,
    availableBalance: totalEarnings - withdrawn - pendingAmount,
    pendingPayouts: pendingPayouts.map(p => ({
      _id: p._id,
      amount: p.amount,
      requestedAt: p.createdAt,
      status: p.status
    })),
    payoutHistory: payoutHistory.map(p => ({
      _id: p._id,
      amount: p.amount,
      requestedAt: p.createdAt,
      status: p.status,
      utrNumber: p.utrNumber,
      paymentDate: p.paymentDate,
      paymentMode: p.paymentMethod,
      proofImageUrl: p.proofImageUrl,
      rejectionReasons: p.rejectionReasons,
      rejectionMessage: p.rejectionMessage
    })),
    bankAccount: primaryAccount ? {
      bankName: primaryAccount.bankName,
      accountNumber: primaryAccount.accountNumber,
    } : null
  });
};


export const requestWithdrawal = async (req, res) => {
  const sellerId = req.user.id;
  
  const user = await User.findById(sellerId);
  const isApproved = user.approvalStatus === "approved" || user.isApproved;
  if (!isApproved) {
    return res.status(403).json({ message: "Unverified sellers cannot request payouts. Please verify your identity first." });
  }

  const { amount } = req.body;

  const orders = await Order.find({
    sellerId,
    status: "paid",
  });

  const totalEarnings = orders.reduce(
    (sum, o) => sum + o.sellerAmount,
    0
  );

  const payouts = await Payout.find({
    sellerId,
    status: { $in: ["processing", "paid"] },
  });

  const withdrawn = payouts.reduce(
    (sum, p) => sum + p.netPayableAmount,
    0
  );

  const availableBalance = totalEarnings - withdrawn;

  if (amount > availableBalance) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  // Exact amount requested is transferred; platform commission was already deducted during sale
  const netPayableAmount = amount;

  await Payout.create({
    sellerId,
    amount,
    totalEarnings: amount,
    platformCommission: 0, // Already deducted during product sale
    gstOnCommission: 0, // Removed double-deduction
    totalDeductions: 0, // Removed double-deduction
    netPayableAmount,
    paymentMethod: "manual",
  });

  console.log(`==> Seller ${sellerId} requested withdrawal: ₹${amount}`);

  // Notify Admin
  sendPayoutRequestAdminEmail(user, amount).catch(e => console.error('[Email] Failed to send admin payout notification:', e));

  res.json({ 
    message: "Withdrawal request submitted",
    breakdown: {
      requestedAmount: amount,
      gstAmount: 0,
      netPayableAmount,
    }
  });
};

// Cancel a pending payout request
export const cancelPayoutRequest = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const sellerId = req.user.id;

    const payout = await Payout.findById(payoutId);

    if (!payout) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    // Verify ownership
    if (payout.sellerId.toString() !== sellerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Can only cancel pending payouts
    if (payout.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot cancel payout with status: ${payout.status}` 
      });
    }

    // Delete the payout request
    await Payout.findByIdAndDelete(payoutId);

    console.log(`==> Seller ${sellerId} cancelled payout request ${payoutId}`);

    res.json({ 
      message: "Payout request cancelled successfully",
      refundedAmount: payout.amount 
    });
  } catch (error) {
    console.error("Error cancelling payout:", error);
    res.status(500).json({ message: "Failed to cancel payout request" });
  }
};

// Get seller's all transactions
export const getSellerTransactions = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, search, month } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query
    const query = { sellerId };

    // 1. Status Filter
    if (status && status !== "all") {
      // Map frontend status to backend status if needed
      if (status === "completed") query.status = "paid";
      else if (status === "pending") query.status = "created";
      else if (status === "cancelled") query.status = "failed";
      else query.status = status;
    } else {
      // Default behavior from before: only return paid if no status is specified
      // Wait, let's keep returning paid if status is not provided so we don't break other things, 
      // but if status === 'all', we might want to return all. Let's return all paid for now if 'all'.
      // The previous code always used status: 'paid'
      query.status = "paid";
    }

    // 2. Month Filter (YYYY-MM)
    if (month && month !== "all") {
      const [yearStr, monthStr] = month.split("-");
      const yearNum = parseInt(yearStr);
      const monthIdx = parseInt(monthStr) - 1; // 0-indexed for Date
      const startDate = new Date(yearNum, monthIdx, 1);
      const endDate = new Date(yearNum, monthIdx + 1, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 3. Search Filter
    // Searching across orderId, productName, and buyerEmail
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { razorpayOrderId: searchRegex },
        { productName: searchRegex },
      ];
      // Since buyerName and email are in User model, populated search is complex.
      // We'll stick to orderId and productName for simple filtering to avoid complex aggregation.
      // Or we can fetch user IDs matching the email/name first.
    }

    // Execute paginated query
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("productId", "title thumbnailUrl")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Format transactions with breakdown
    const transactions = orders.map(order => {
      // Back-calculate the base product price. Buyer paid Base + 5% GST + 2% PF = Base * 1.07
      const grossAmount = order.amount || 0;
      const saleAmount = grossAmount / 1.07;
      const netAmount = order.sellerAmount || 0;
      const totalDeduction = saleAmount - netAmount;

      return {
        _id: order._id,
        orderId: order.razorpayOrderId || order._id.toString(),
        productName: order.productName || order.productId?.title || "Unknown Product",
        thumbnailUrl: order.productId?.thumbnailUrl || null,
        buyerName: order.buyerId?.name || "Unknown Buyer",
        buyerEmail: order.buyerId?.email || "Unknown Email",
        saleAmount: Number(saleAmount.toFixed(2)),
        platformFee: Number(totalDeduction.toFixed(2)),
        gstOnFee: 0,
        netAmount: Number(netAmount.toFixed(2)),
        date: order.createdAt,
        status: "completed"
      };
    });

    res.json({
      transactions,
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalOrders / limitNum)
      },
      summary: {
        total: totalOrders,
        totalRevenue: Number(transactions.reduce((sum, t) => sum + t.saleAmount, 0).toFixed(2)),
        totalPlatformFee: Number(transactions.reduce((sum, t) => sum + t.platformFee, 0).toFixed(2)),
        totalGST: Number(transactions.reduce((sum, t) => sum + t.gstOnFee, 0).toFixed(2)),
        totalEarned: Number(transactions.reduce((sum, t) => sum + t.netAmount, 0).toFixed(2))
      }
    });
  } catch (error) {
    console.error("Error fetching seller transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// Get all sales (including failed, pending, and paid)
export const getAllTransactionsForSeller = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "all",
      status = "all",
      sortBy = "date_desc",
      dateRange,
      startDate,
      endDate,
    } = req.query;
    const normalizedType = typeof type === "string" ? type.toLowerCase() : "all";
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "all";
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sellerId = req.user.id;
    
    let dateQuery = null;
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      if (dateRange === "7d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      else if (dateRange === "30d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      else if (dateRange === "90d") dateQuery = { $gte: new Date(now.setDate(now.getDate() - 90)) };
    } else if (startDate && endDate) {
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

    const orderFilter = { sellerId };
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") orderFilter.status = { $in: ["paid"] };
      else if (normalizedStatus === "failed") orderFilter.status = { $in: ["failed"] };
      else orderFilter.status = { $in: ["created"] };
    }
    if (dateQuery) orderFilter.createdAt = dateQuery;
    
    const payoutFilter = { sellerId };
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") payoutFilter.status = { $in: ["paid"] };
      else if (normalizedStatus === "failed") payoutFilter.status = { $in: ["rejected"] };
      else payoutFilter.status = { $in: ["pending", "processing"] };
    }
    if (dateQuery) payoutFilter.createdAt = dateQuery;

    // Build filters for Promotions
    const promotionFilter = { sellerId };
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") promotionFilter.paymentStatus = { $in: ["PAID"] };
      else if (normalizedStatus === "failed") promotionFilter.paymentStatus = { $in: ["FAILED"] };
      else promotionFilter.paymentStatus = { $in: ["PENDING"] };
    } else {
      promotionFilter.paymentStatus = { $in: ["PAID", "FAILED", "PENDING"] };
    }
    if (dateQuery) promotionFilter.createdAt = dateQuery;

    let orders = [];
    let payouts = [];
    let promotions = [];

    if (normalizedType === "all" || normalizedType === "buyer_to_admin") {
      const query = { ...orderFilter };
      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: "i" } },
          { razorpayOrderId: { $regex: search, $options: "i" } }
        ];
      }
      orders = await Order.find(query)
        .populate("buyerId", "name email")
        .populate("productId", "title")
        .sort({ createdAt: -1 });
    }

    if (normalizedType === "all" || normalizedType === "admin_to_seller") {
      const query = { ...payoutFilter };
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

    if (normalizedType === "all" || normalizedType === "seller_to_admin") {
      const query = { ...promotionFilter };
      if (search) {
        query.$or = [
          { productTitle: { $regex: search, $options: "i" } },
          { razorpayOrderId: { $regex: search, $options: "i" } },
          { transactionId: { $regex: search, $options: "i" } }
        ];
      }
      promotions = await PromotionRequest.find(query).sort({ createdAt: -1 });
    }

    const buyerTransactions = orders.map(order => ({
      _id: order._id,
      type: "buyer_to_admin",
      orderId: order.razorpayOrderId || order._id.toString(),
      buyerName: order.buyerId?.name || "Unknown Buyer",
      buyerEmail: order.buyerId?.email || "Unknown",
      productName: order.productName || order.productId?.title || "Unknown Product",
      amount: order.sellerAmount || (order.amount ? order.amount / 1.07 : 0),
      status: order.status === "paid" ? "success" : order.status === "failed" ? "failed" : "pending",
      date: order.createdAt,
      createdAt: order.createdAt,
      paymentMethod: "razorpay",
      razorpayPaymentId: order.razorpayPaymentId,
      razorpayOrderId: order.razorpayOrderId
    }));

    const sellerTransactions = payouts.map(payout => ({
      _id: payout._id,
      type: "admin_to_seller",
      orderId: payout._id.toString(),
      sellerName: payout.sellerId?.name || "Unknown Seller",
      sellerEmail: payout.sellerId?.email || "Unknown",
      productName: "Bank Withdrawal",
      amount: payout.netPayableAmount || payout.amount || 0,
      status: payout.status === "paid" ? "success" : payout.status === "rejected" ? "failed" : "pending",
      date: payout.paidAt || payout.createdAt,
      createdAt: payout.paidAt || payout.createdAt,
      paymentMethod: payout.paymentMethod || "manual",
      paymentReference: payout.paymentReference,
      razorpayPaymentId: payout.paymentReference, // For UI compatibility
      errorReason: payout.rejectionReason
    }));

    const sellerPromotionTransactions = promotions.map(promo => ({
      _id: promo._id,
      type: "seller_to_admin",
      orderId: promo.razorpayOrderId || promo.transactionId || promo._id.toString(),
      sellerName: promo.sellerName || "You",
      sellerEmail: req.user.email,
      buyerName: "BitForge Settlement Account", // To align with the UI
      productName: `Promotion: ${promo.productTitle}`,
      amount: promo.amount || 0,
      status: promo.paymentStatus === "PAID" ? "success" : promo.paymentStatus === "FAILED" ? "failed" : "pending",
      date: promo.paidAt || promo.paymentSubmittedAt || promo.createdAt,
      createdAt: promo.createdAt,
      paymentMethod: promo.paymentMethod || "RAZORPAY",
      razorpayOrderId: promo.razorpayOrderId,
      razorpayPaymentId: promo.razorpayPaymentId || promo.transactionId,
    }));

    let allTransactions = [...buyerTransactions, ...sellerTransactions, ...sellerPromotionTransactions];

    if (normalizedType !== "all") allTransactions = allTransactions.filter((t) => t.type === normalizedType);
    if (normalizedStatus !== "all") allTransactions = allTransactions.filter((t) => t.status === normalizedStatus);

    if (search) {
      const s = search.toLowerCase();
      allTransactions = allTransactions.filter(t => 
        (t.buyerName?.toLowerCase().includes(s)) ||
        (t.productName?.toLowerCase().includes(s)) ||
        (t.orderId?.toLowerCase().includes(s))
      );
    }

    allTransactions.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      return new Date(b.date) - new Date(a.date);
    });

    const paginatedTransactions = allTransactions.slice(skip, skip + parseInt(limit));

    const successfulAmount = allTransactions
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);
    const successfulCount = allTransactions.filter((t) => t.status === "success").length;

    const pendingAmount = allTransactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = allTransactions.filter((t) => t.status === "pending").length;

    const failedAmount = allTransactions
      .filter((t) => t.status === "failed")
      .reduce((sum, t) => sum + t.amount, 0);
    const failedCount = allTransactions.filter((t) => t.status === "failed").length;

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        total: allTransactions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(allTransactions.length / parseInt(limit))
      },
      summary: {
        total: {
          count: allTransactions.length,
          amount: allTransactions.reduce((sum, t) => sum + t.amount, 0)
        },
        success: { count: successfulCount, amount: successfulAmount },
        pending: { count: pendingCount, amount: pendingAmount },
        failed: { count: failedCount, amount: failedAmount }
      }
    });
  } catch (error) {
    console.error("Error fetching all transactions for seller:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, search, month, sortBy = "date_desc" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query object
    const query = { sellerId };

    if (status && status !== "all") {
      query.status = status;
    }

    // Month filter
    if (month) {
      // month is expected to be in "YYYY-MM" format
      const [year, monthStr] = month.split("-");
      if (year && monthStr) {
        const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthStr), 0, 23, 59, 59, 999);
        query.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }
    }

    // Determine sort
    let sortConfig = { createdAt: -1 };
    if (sortBy === "date_asc") {
      sortConfig = { createdAt: 1 };
    }

    // Since we need to search by buyer name/email or product name, we might have to fetch and then filter
    // Or we can do a populate match if possible. Given the scale, fetching and filtering might be required
    // if search is provided. However, let's first get the count without search for pagination.
    // If search is provided, we fetch more and filter in memory, or we can use aggregation.
    // For simplicity, if search is present, we will fetch all matching the query and filter in memory.
    
    let ordersQuery = Order.find(query)
      .populate("productId", "title thumbnailUrl")
      .populate("buyerId", "name email")
      .sort(sortConfig);

    let orders = await ordersQuery.lean();

    // In-memory search filter
    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(o => 
        (o.productName?.toLowerCase().includes(s)) ||
        (o.productId?.title?.toLowerCase().includes(s)) ||
        (o.buyerId?.name?.toLowerCase().includes(s)) ||
        (o.buyerId?.email?.toLowerCase().includes(s)) ||
        (o.razorpayOrderId?.toLowerCase().includes(s)) ||
        (o._id?.toString().toLowerCase().includes(s))
      );
    }

    const totalCount = orders.length;
    
    // Apply pagination in memory since we might have filtered by search
    orders = orders.slice(skip, skip + parseInt(limit));

    // Format sales with breakdown
    const sales = orders.map(order => {
      // Back-calculate the base product price. Buyer paid Base + 5% GST + 2% PF = Base * 1.07
      const grossAmount = order.amount || 0;
      const saleAmount = grossAmount / 1.07;
      const netAmount = order.sellerAmount || 0;
      const totalDeduction = saleAmount - netAmount;

      return {
        _id: order._id,
        orderId: order.razorpayOrderId || order._id.toString(),
        productName: order.productName || order.productId?.title || "Unknown Product",
        productId: order.productId?._id || null,
        thumbnailUrl: order.productId?.thumbnailUrl || null,
        buyerName: order.buyerId?.name || "Unknown Buyer",
        buyerEmail: order.buyerId?.email || "Unknown Email",
        amount: Number(saleAmount.toFixed(2)),
        platformFee: Number(totalDeduction.toFixed(2)),
        sellerAmount: Number(netAmount.toFixed(2)),
        status: order.status, // paid, failed, created
        date: order.createdAt,
        razorpayPaymentId: order.razorpayPaymentId || null,
        razorpayOrderId: order.razorpayOrderId || null,
      };
    });

    res.json({
      sales,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching all sales:", error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
};
// Get growth analytics with detailed insights
export const getGrowthAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const now = new Date();
    
    // Calculate current month range
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Calculate last month range
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all paid orders
    const allOrders = await Order.find({ sellerId, status: "paid" });

    // Current month orders
    const currentMonthOrders = allOrders.filter(
      o => o.createdAt >= startOfCurrentMonth && o.createdAt <= endOfCurrentMonth
    );
    
    // Last month orders
    const lastMonthOrders = allOrders.filter(
      o => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth
    );

    // Calculate metrics
    const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
    
    const currentMonthSales = currentMonthOrders.length;
    const lastMonthSales = lastMonthOrders.length;

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue === 0
      ? (currentMonthRevenue > 0 ? 100 : 0)
      : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    const salesGrowth = lastMonthSales === 0
      ? (currentMonthSales > 0 ? 100 : 0)
      : ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100;

    // Calculate average order value
    const averageOrderValue = currentMonthSales > 0 
      ? currentMonthRevenue / currentMonthSales 
      : 0;
    
    const lastMonthAvgOrderValue = lastMonthSales > 0
      ? lastMonthRevenue / lastMonthSales
      : 0;

    const averageOrderValueGrowth = lastMonthAvgOrderValue === 0
      ? (averageOrderValue > 0 ? 100 : 0)
      : ((averageOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100;

    // Build monthly data for last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthOrders = allOrders.filter(
        o => o.createdAt >= monthStart && o.createdAt <= monthEnd
      );

      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
      const monthSales = monthOrders.length;

      // Calculate growth compared to previous month
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      
      const prevMonthOrders = allOrders.filter(
        o => o.createdAt >= prevMonthStart && o.createdAt <= prevMonthEnd
      );
      
      const prevMonthRevenue = prevMonthOrders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);
      
      const monthGrowth = prevMonthRevenue === 0
        ? (monthRevenue > 0 ? 100 : 0)
        : ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

      monthlyData.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        revenue: Math.round(monthRevenue),
        sales: monthSales,
        growth: Math.round(monthGrowth * 10) / 10 // Round to 1 decimal
      });
    }

    res.json({
      currentMonthRevenue: Math.round(currentMonthRevenue),
      lastMonthRevenue: Math.round(lastMonthRevenue),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      currentMonthSales,
      lastMonthSales,
      salesGrowth: Math.round(salesGrowth * 10) / 10,
      averageOrderValue: Math.round(averageOrderValue),
      averageOrderValueGrowth: Math.round(averageOrderValueGrowth * 10) / 10,
      monthlyData
    });
  } catch (error) {
    console.error("Error fetching growth analytics:", error);
    res.status(500).json({ message: "Failed to fetch growth analytics" });
  }
};

export const getSellerReviews = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { sellerId, isHidden: false };

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Filter by response status
    if (req.query.hasResponse === "true") {
      query["sellerResponse.text"] = { $exists: true, $ne: "" };
    } else if (req.query.hasResponse === "false") {
      query.$or = [
        { sellerResponse: { $exists: false } },
        { "sellerResponse.text": { $exists: false } },
        { "sellerResponse.text": "" }
      ];
    }

    // Search in comment or title
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      const searchOr = [
        { comment: searchRegex },
        { title: searchRegex }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const reviews = await Review.find(query)
      .populate("buyerId", "name email profilePictureUrl")
      .populate("productId", "title thumbnailUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};