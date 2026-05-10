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
    const hasQueryControls = ["page", "limit", "status", "sortBy", "search"].some(
      (key) => req.query[key] !== undefined
    );

    const formatTransaction = (order) => ({
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
    });

    if (!hasQueryControls) {
      const allOrders = await Order.find({ buyerId })
        .populate("productId", "title")
        .populate("sellerId", "name email")
        .sort({ createdAt: -1 });

      const summary = allOrders.reduce(
        (acc, order) => {
          acc.total += 1;
          if (order.status === "paid") {
            acc.successful += 1;
            acc.totalSpent += order.amount || 0;
          } else if (order.status === "created") {
            acc.pending += 1;
          } else if (order.status === "failed") {
            acc.failed += 1;
          }
          return acc;
        },
        {
          total: 0,
          successful: 0,
          pending: 0,
          failed: 0,
          totalSpent: 0,
        }
      );

      return res.json({
        transactions: allOrders.map(formatTransaction),
        summary,
        pagination: {
          page: 1,
          limit: allOrders.length || 1,
          totalRecords: allOrders.length,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
        },
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const status = req.query.status || "all";
    const sortBy = req.query.sortBy;
    let sortQuery = { createdAt: -1 };
    if (sortBy === "oldest") sortQuery = { createdAt: 1 };
    else if (sortBy === "highest") sortQuery = { amount: -1 };
    else if (sortBy === "lowest") sortQuery = { amount: 1 };
    const search = (req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const query = { buyerId };

    if (status !== "all" && ["paid", "created", "failed"].includes(status)) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ productName: searchRegex }, { razorpayOrderId: searchRegex }];
    }

    const totalRecords = await Order.countDocuments(query);
    const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);

    // Fetch paginated orders for this buyer
    const orders = await Order.find(query)
      .populate("productId", "title")
      .populate("sellerId", "name email")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // Summary across all buyer orders (independent of filters)
    const buyerOrdersForSummary = await Order.find({ buyerId }).select("status amount");
    const summary = buyerOrdersForSummary.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === "paid") {
          acc.successful += 1;
          acc.totalSpent += order.amount || 0;
        } else if (order.status === "created") {
          acc.pending += 1;
        } else if (order.status === "failed") {
          acc.failed += 1;
        }
        return acc;
      },
      {
        total: 0,
        successful: 0,
        pending: 0,
        failed: 0,
        totalSpent: 0,
      }
    );

    // Format transactions
    const transactions = orders.map(formatTransaction);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      summary,
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
      .populate("productId", "title description thumbnailUrl fileUrl fileKey category")
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


