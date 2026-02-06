


import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Product from "../models/Product.js";

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
  });

  const pendingAmount = pendingPayouts.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  res.json({
    totalEarnings,
    withdrawn,
    pendingWithdrawals: pendingAmount,
    availableBalance: totalEarnings - withdrawn - pendingAmount,
  });
};


export const requestWithdrawal = async (req, res) => {
  const sellerId = req.user.id;
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

  // Calculate financial breakdown for transparency
  const PLATFORM_COMMISSION_RATE = 0.10; // 10%
  const GST_RATE = 0.18; // 18%
  
  const platformCommission = amount * PLATFORM_COMMISSION_RATE;
  const gstOnCommission = platformCommission * GST_RATE;
  const totalDeductions = platformCommission + gstOnCommission;
  const netPayableAmount = amount - totalDeductions;

  await Payout.create({
    sellerId,
    amount,
    totalEarnings: amount,
    platformCommission,
    gstOnCommission,
    totalDeductions,
    netPayableAmount,
    paymentMethod: "manual",
  });

  res.json({ 
    message: "Withdrawal request submitted",
    breakdown: {
      requestedAmount: amount,
      platformCommission,
      gstOnCommission,
      totalDeductions,
      netPayableAmount,
    }
  });
};

// Get seller's all transactions
export const getSellerTransactions = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Fetch all paid orders for this seller
    const orders = await Order.find({ sellerId, status: "paid" })
      .populate("productId", "title")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

    // Format transactions with breakdown
    const transactions = orders.map(order => {
      const saleAmount = order.amount || 0;
      const platformFee = order.platformFee || (saleAmount * 0.10);
      const gstOnFee = platformFee * 0.18;
      const netAmount = saleAmount - platformFee - gstOnFee;

      return {
        _id: order._id,
        orderId: order.razorpayOrderId || order._id.toString(),
        productName: order.productId?.title || "Unknown Product",
        buyerName: order.buyerId?.name || "Unknown Buyer",
        buyerEmail: order.buyerId?.email || "Unknown Email",
        saleAmount: saleAmount,
        platformFee: Math.round(platformFee),
        gstOnFee: Math.round(gstOnFee),
        netAmount: Math.round(netAmount),
        date: order.createdAt,
        status: "completed"
      };
    });

    res.json({
      transactions,
      summary: {
        total: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + t.saleAmount, 0),
        totalPlatformFee: transactions.reduce((sum, t) => sum + t.platformFee, 0),
        totalGST: transactions.reduce((sum, t) => sum + t.gstOnFee, 0),
        totalEarned: transactions.reduce((sum, t) => sum + t.netAmount, 0)
      }
    });
  } catch (error) {
    console.error("Error fetching seller transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// Get all sales (including failed, pending, and paid)
export const getAllSales = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Fetch ALL orders for this seller (paid, failed, created)
    const orders = await Order.find({ sellerId })
      .populate("productId", "title")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

    // Format sales with breakdown
    const sales = orders.map(order => {
      const saleAmount = order.amount || 0;
      const platformFee = order.platformFee || (saleAmount * 0.10);
      const gstOnFee = platformFee * 0.18;
      const netAmount = saleAmount - platformFee - gstOnFee;

      return {
        _id: order._id,
        orderId: order.razorpayOrderId || order._id.toString(),
        productName: order.productId?.title || "Unknown Product",
        productId: order.productId?._id || null,
        buyerName: order.buyerId?.name || "Unknown Buyer",
        buyerEmail: order.buyerId?.email || "Unknown Email",
        amount: saleAmount,
        platformFee: Math.round(platformFee),
        sellerAmount: Math.round(netAmount),
        status: order.status, // paid, failed, created
        date: order.createdAt,
        razorpayPaymentId: order.razorpayPaymentId || null,
        razorpayOrderId: order.razorpayOrderId || null,
      };
    });

    res.json({
      sales
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