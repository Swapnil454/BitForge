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
    
    // Initialize last 6 months dynamically
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsToShow = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = monthNames[date.getMonth()];
      monthsToShow.push(monthKey);
      monthlyData[monthKey] = { amount: 0, purchases: 0 };
    }

    // Aggregate data
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const month = monthNames[date.getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].amount += order.amount || 0;
        monthlyData[month].purchases += 1;
      }
    });

    const data = monthsToShow.map(month => ({
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
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      sortBy = "date_desc",
      dateRange,
      startDate,
      endDate,
    } = req.query;

    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "all";
    const skip = (parseInt(page) - 1) * parseInt(limit);

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

    const orderFilter = { buyerId };
    
    if (normalizedStatus !== "all") {
      if (normalizedStatus === "success") orderFilter.status = { $in: ["paid"] };
      else if (normalizedStatus === "failed") orderFilter.status = { $in: ["failed"] };
      else orderFilter.status = { $in: ["created"] };
    }
    if (dateQuery) orderFilter.createdAt = dateQuery;

    if (search) {
      orderFilter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } }
      ];
    }

    // Fetch all matching for aggregation/summary
    const orders = await Order.find(orderFilter)
      .populate("sellerId", "name email")
      .populate("productId", "title")
      .populate("buyerId", "name email");

    let allTransactions = orders.map(order => ({
      _id: order._id,
      type: "buyer_to_admin",
      orderId: order.razorpayOrderId || order._id.toString(),
      buyerName: order.buyerId?.name || "Unknown",
      buyerEmail: order.buyerId?.email || "Unknown",
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      productName: order.productName || order.productId?.title || "Unknown Product",
      amount: order.amount || 0,
      status: order.status === "paid" ? "success" : order.status === "failed" ? "failed" : "pending",
      date: order.createdAt,
      createdAt: order.createdAt,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentMethod: "razorpay"
    }));

    // final string search for populated fields
    if (search) {
      const s = search.toLowerCase();
      allTransactions = allTransactions.filter(t => 
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

    const summary = {
      total: { count: total, amount: allTransactions.reduce((acc, t) => acc + t.amount, 0) },
      success: { count: successTransactions.length, amount: successTransactions.reduce((acc, t) => acc + t.amount, 0) },
      pending: { count: pendingTransactions.length, amount: pendingTransactions.reduce((acc, t) => acc + t.amount, 0) },
      failed: { count: failedTransactions.length, amount: failedTransactions.reduce((acc, t) => acc + t.amount, 0) }
    };

    res.json({
      transactions: paginatedTransactions,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching buyer transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

export const getBuyerTransactionAnalytics = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { dateRange = "30d" } = req.query;

    const now = new Date();
    let startDate = new Date();
    
    if (dateRange === "7d") startDate.setDate(now.getDate() - 7);
    else if (dateRange === "30d") startDate.setDate(now.getDate() - 30);
    else if (dateRange === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date(0); // All time

    const orders = await Order.find({ buyerId, createdAt: { $gte: startDate } }).select("amount status createdAt");

    // Process Timeline (aggregate by date)
    const timelineMap = {};
    orders.forEach(order => {
      if (order.status !== "paid") return;
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, amount: 0, count: 0 };
      }
      timelineMap[dateKey].amount += order.amount || 0;
      timelineMap[dateKey].count += 1;
    });
    const timeline = Object.values(timelineMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Summary logic
    const summary = {
      total: { count: 0, amount: 0 },
      success: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 }
    };
    orders.forEach(order => {
      summary.total.count += 1;
      summary.total.amount += order.amount || 0;
      if (order.status === "paid") {
        summary.success.count += 1;
        summary.success.amount += order.amount || 0;
      } else if (order.status === "failed") {
        summary.failed.count += 1;
        summary.failed.amount += order.amount || 0;
      } else {
        summary.pending.count += 1;
        summary.pending.amount += order.amount || 0;
      }
    });

    res.json({ timeline, summary });
  } catch (error) {
    console.error("Error fetching buyer transaction analytics:", error);
    res.status(500).json({ message: "Failed to fetch transaction analytics" });
  }
};

// Get single transaction details

export const getBuyerPurchaseAnalytics = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const range = req.query.range || req.query.dateRange || "30";

    const now = new Date();
    let startDate = new Date();
    
    if (range === "7") startDate.setDate(now.getDate() - 7);
    else if (range === "30") startDate.setDate(now.getDate() - 30);
    else if (range === "90") startDate.setDate(now.getDate() - 90);
    else startDate = new Date(0); // All time

    // Fetch orders with populated product and seller
    const orders = await Order.find({ buyerId, status: "paid", createdAt: { $gte: startDate } })
      .populate("productId", "category title")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    const stats = {
      total: orders.length,
      totalValue: 0,
      totalDownloads: 0,
      recentSubmissions: 0,
      limitReached: 0,
    };

    const categoriesMap = {};
    const sellersMap = {};
    const timelineMap = {};
    
    // Determine recent threshold (e.g. last 7 days from now)
    const recentThreshold = new Date();
    recentThreshold.setDate(now.getDate() - 7);

    orders.forEach(order => {
      stats.totalValue += order.amount || 0;
      stats.totalDownloads += order.downloadCount || 0;
      if (order.createdAt >= recentThreshold) {
        stats.recentSubmissions += 1;
      }
      if ((order.downloadCount || 0) >= (order.downloadLimit || 5)) {
        stats.limitReached += 1;
      }

      // Categories
      const cat = order.productId?.category || "other";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;

      // Sellers
      if (order.sellerId) {
        const sid = order.sellerId._id.toString();
        if (!sellersMap[sid]) {
          sellersMap[sid] = {
            id: sid,
            name: order.sellerId.name || "Unknown",
            email: order.sellerId.email || "Unknown",
            purchaseCount: 0,
            spentValue: 0,
          };
        }
        sellersMap[sid].purchaseCount += 1;
        sellersMap[sid].spentValue += order.amount || 0;
      }

      // Timeline
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { count: 0, amount: 0 };
      }
      timelineMap[dateKey].count += 1;
      timelineMap[dateKey].amount += order.amount || 0;
    });

    // Formatting for frontend
    const categories = Object.keys(categoriesMap).map(cat => ({
      _id: cat.toLowerCase().replace(/\s+/g, '_'),
      count: categoriesMap[cat],
    })).sort((a, b) => b.count - a.count);

    const topSellers = Object.values(sellersMap)
      .sort((a, b) => b.spentValue - a.spentValue)
      .slice(0, 5);

    // Get a sorted list of unique dates between startDate and today if range is not 'all'
    const sortedDates = Object.keys(timelineMap).sort((a, b) => new Date(a) - new Date(b));
    let labels = [];
    let counts = [];
    let amounts = [];
    
    if (range !== "all" && sortedDates.length > 0) {
       // Fill in missing dates for timeline
       let currentDate = new Date(startDate);
       while (currentDate <= now) {
         const dKey = currentDate.toISOString().split("T")[0];
         labels.push(dKey);
         counts.push(timelineMap[dKey]?.count || 0);
         amounts.push(timelineMap[dKey]?.amount || 0);
         currentDate.setDate(currentDate.getDate() + 1);
       }
    } else {
       labels = sortedDates;
       counts = sortedDates.map(d => timelineMap[d].count);
       amounts = sortedDates.map(d => timelineMap[d].amount);
    }

    const timeline = { labels, counts, amounts };

    // Recent purchases
    const recentPurchases = orders.slice(0, 10).map(order => ({
      _id: order._id.toString(),
      productName: order.productId?.title || order.productName || "Unknown Product",
      category: order.productId?.category || "Other",
      sellerName: order.sellerId?.name || "Unknown Seller",
      amount: order.amount || 0,
      downloadCount: order.downloadCount || 0,
      createdAt: order.createdAt.toISOString(),
    }));

    res.json({ stats, categories, topSellers, recentPurchases, timeline });
  } catch (error) {
    console.error("Error fetching buyer purchase analytics:", error);
    res.status(500).json({ message: "Failed to fetch purchase analytics" });
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
      productName: order.productName || order.productId?.title || "Unknown Product",
      productId: order.productId?._id || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      amount: order.amount || 0,
      status: order.status,
      date: order.createdAt,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
      // Don't expose direct URL - use /api/download/:orderId endpoint for signed URL
      downloadAvailable: order.status === "paid" && !!order.productId?.fileKey,
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
    const mapPurchase = (order) => ({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productName || order.productId?.title || "Unknown Product",
      productId: order.productId?._id || null,
      productSlug: order.productId?.slug || null,
      thumbnailUrl: order.productId?.thumbnailUrl || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      amount: order.amount || 0,
      status: order.status || "paid",
      purchaseDate: order.createdAt,
      downloadCount: order.downloadCount || 0,
      downloadLimit: order.downloadLimit || 5,
    });

    // Default to page 1, limit 7 if no pagination params are provided
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 7, 1), 50);
    const sortBy = req.query.sortBy === "oldest" ? "oldest" : "newest";
    const search = (req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const query = { buyerId, status: "paid" };

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ productName: searchRegex }, { razorpayOrderId: searchRegex }];
    }

    const totalRecords = await Order.countDocuments(query);
    const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);

    const orders = await Order.find(query)
      .populate("productId", "title description thumbnailUrl fileUrl fileKey category slug")
      .populate("sellerId", "name email")
      .sort({ createdAt: sortBy === "newest" ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      purchases: orders.map(mapPurchase),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
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
      .populate("productId", "title description thumbnailUrl fileUrl fileKey category isDeleted")
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

    // Build filename for display
    const filename = order.productId?.title
      ? `${order.productId.title.replace(/[^a-z0-9]/gi, "_")}.pdf`
      : "download.pdf";

    // Don't expose direct URL - client should use /api/download/:orderId for signed URL
    const downloadAvailable = !!order.productId?.fileKey;

    // Check if product is soft-deleted (archived)
    const isProductDeleted = order.productId?.isDeleted === true;

    // Return purchase details
    res.json({
      _id: order._id,
      orderId: order.razorpayOrderId || order._id.toString(),
      productName: order.productName || order.productId?.title || "Unknown Product",
      productDescription: order.productId?.description || "",
      productId: order.productId?._id || null,
      thumbnailUrl: order.productId?.thumbnailUrl || null,
      category: order.productId?.category || null,
      sellerName: order.sellerId?.name || "Unknown Seller",
      sellerEmail: order.sellerId?.email || "Unknown Email",
      amount: order.amount || 0,
      purchaseDate: order.createdAt,
      downloadCount: order.downloadCount || 0,
      downloadLimit: order.downloadLimit || 5,
      downloadAvailable,
      filename,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpayOrderId: order.razorpayOrderId || null,
      isProductDeleted, // Flag for frontend to show "Product no longer available" message
    });
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    res.status(500).json({ message: "Failed to fetch purchase details" });
  }
};

// View purchased product details (works even for soft-deleted products)
export const getPurchasedProductDetails = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId } = req.params;

    // Check if buyer has purchased this product
    const order = await Order.findOne({
      buyerId,
      productId,
      status: "paid"
    });

    if (!order) {
      return res.status(403).json({ 
        message: "You haven't purchased this product",
        hasPurchased: false
      });
    }

    // Get product details (including soft-deleted)
    const product = await Product.findById(productId)
      .populate("sellerId", "name email isVerified profilePictureUrl bio");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Build the response with isDeleted flag
    res.json({
      hasPurchased: true,
      isDeleted: product.isDeleted === true,
      deletedMessage: product.isDeleted 
        ? "This product has been removed from the marketplace. You can still access your purchased files." 
        : null,
      product: {
        _id: product._id,
        title: product.title,
        description: product.description,
        price: product.price,
        discount: product.discount,
        thumbnailUrl: product.thumbnailUrl,
        category: product.category,
        pageCount: product.pageCount,
        language: product.language,
        format: product.format,
        intendedAudience: product.intendedAudience,
        lastUpdatedAt: product.lastUpdatedAt,
        createdAt: product.createdAt,
        seller: {
          _id: product.sellerId?._id,
          name: product.sellerId?.name,
          email: product.sellerId?.email,
          isVerified: product.sellerId?.isVerified,
          profilePictureUrl: product.sellerId?.profilePictureUrl,
          bio: product.sellerId?.bio
        }
      },
      purchase: {
        orderId: order._id,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.amount,
        purchaseDate: order.createdAt,
        downloadCount: order.downloadCount || 0,
        downloadLimit: order.downloadLimit || 5,
        downloadAvailable: !!product.fileKey
      }
    });
  } catch (error) {
    console.error("Error fetching purchased product:", error);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
};


