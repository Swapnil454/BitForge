import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Get buyer dashboard stats
export const getBuyerStats = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get all paid orders for this buyer
    const orders = await Order.find({
      buyerId,
      status: "paid",
    })
      .populate("productId", "title thumbnail")
      .sort({ createdAt: -1 });

    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

    // Count purchases
    const totalPurchases = orders.length;

    // For now, count all paid orders as downloads
    // In future, this can be tracked separately
    const downloads = orders.length;

    res.json({
      totalSpent,
      totalPurchases,
      downloads,
      recentOrders: orders.slice(0, 5).map(o => ({
        id: o._id,
        orderId: o.razorpayOrderId,
        product: o.productId?.title || "Unknown Product",
        amount: o.amount,
        status: o.status,
        date: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching buyer stats:", error);
    res.status(500).json({ message: "Failed to fetch buyer stats" });
  }
};

// Get buyer spending over time (last 6 months)
export const getBuyerSpendingOverTime = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await Order.find({
      buyerId,
      status: "paid",
      createdAt: { $gte: sixMonthsAgo },
    });

    // Group by month
    const monthlyData = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    
    // Initialize months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = `${months[date.getMonth()]}`;
      monthlyData[monthKey] = { spent: 0, purchases: 0 };
    }

    // Aggregate data
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const month = months[date.getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].spent += order.amount || 0;
        monthlyData[month].purchases += 1;
      }
    });

    const data = months.map(month => ({
      month,
      ...monthlyData[month],
    }));

    res.json(data);
  } catch (error) {
    console.error("Error fetching spending over time:", error);
    res.status(500).json({ message: "Failed to fetch spending data" });
  }
};

// Get wishlist items count
export const getWishlistCount = async (req, res) => {
  try {
    // Wishlist is stored in localStorage on client side
    // This endpoint can be used when implementing server-side wishlist storage
    res.json({ wishlistCount: 0 });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};
// Get all buyer transactions
export const getAllBuyerTransactions = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Fetch all orders for this buyer (paid, failed, created)
    const orders = await Order.find({ buyerId })
      .populate("productId", "title")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    // Format transactions
    const transactions = orders.map(order => ({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productId?.title || "Unknown Product",
      productId: order.productId?._id || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      amount: order.amount || 0,
      status: order.status, // paid, failed, created
      date: order.createdAt,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
    }));

    res.json({
      transactions
    });
  } catch (error) {
    console.error("Error fetching buyer transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// Get single transaction details
export const getBuyerTransactionDetails = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { orderId } = req.params;

    // Fetch order
    const order = await Order.findById(orderId)
      .populate("productId", "title")
      .populate("sellerId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify ownership - buyer can only see their own orders
    if (order.buyerId.toString() !== buyerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Return transaction details
    res.json({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productId?.title || "Unknown Product",
      productId: order.productId?._id || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      amount: order.amount || 0,
      status: order.status,
      date: order.createdAt,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
      downloadUrl: order.productId?.fileUrl || null,
    });
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ message: "Failed to fetch transaction details" });
  }
};

// Get all buyer purchases (only paid orders)
export const getAllBuyerPurchases = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Fetch all paid orders for this buyer
    const orders = await Order.find({ buyerId, status: "paid" })
      .populate("productId", "title description thumbnailUrl fileUrl category")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    // Format purchases
    const purchases = orders.map(order => ({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productId?.title || "Unknown Product",
      productId: order.productId?._id || null,
      thumbnailUrl: order.productId?.thumbnailUrl || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      amount: order.amount || 0,
      purchaseDate: order.createdAt,
    }));

    res.json({
      purchases
    });
  } catch (error) {
    console.error("Error fetching buyer purchases:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
};

// Get single purchase details
export const getBuyerPurchaseDetails = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { purchaseId } = req.params;

    // Fetch order
    const order = await Order.findById(purchaseId)
      .populate("productId", "title description thumbnailUrl fileUrl category")
      .populate("sellerId", "name email");

    if (!order) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Verify ownership and payment status
    if (order.buyerId.toString() !== buyerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({ message: "This order is not completed yet" });
    }

    // Return purchase details
    res.json({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productId?.title || "Unknown Product",
      productDescription: order.productId?.description || "",
      productId: order.productId?._id || null,
      thumbnailUrl: order.productId?.thumbnailUrl || null,
      category: order.productId?.category || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      amount: order.amount || 0,
      purchaseDate: order.createdAt,
      downloadUrl: order.productId?.fileUrl || null,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
    });
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    res.status(500).json({ message: "Failed to fetch purchase details" });
  }
};
