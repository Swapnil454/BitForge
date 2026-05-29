import Dispute from "../models/Dispute.js";
import Order from "../models/Order.js";

export const getBuyerDisputes = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, search, sort, page = 1, limit = 10 } = req.query;

    let matchStage = { buyerId: req.user._id };
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
      { $match: { buyerId: req.user._id } }, // Match all buyer disputes for stats
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
            { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [
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
        orderId: d.order?._id || null,
        disputeNumber: `DIS-${d._id.toString().slice(-6).toUpperCase()}`,
        productTitle: d.product?.title || "Unknown Product",
        productCategory: d.product?.category || "Unknown",
        productFileType: d.product?.fileType || "Unknown",
        buyer: {
          name: req.user.name || "You",
          email: req.user.email || "N/A",
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
    console.error("Error fetching buyer disputes:", error);
    res.status(500).json({ message: "Failed to load disputes" });
  }
};

export const getBuyerDisputeAnalytics = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { range } = req.query;
    const days = range && range !== "all" ? Number(range) : null;
    const now = new Date();
    const startDate = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;

    const [totalDisputes, open, resolved, rejected] = await Promise.all([
      Dispute.countDocuments({ buyerId }),
      Dispute.countDocuments({ buyerId, status: "open" }),
      Dispute.countDocuments({ buyerId, status: "resolved" }),
      Dispute.countDocuments({ buyerId, status: "rejected" }),
    ]);

    // Category breakdown
    const categories = await Dispute.aggregate([
      { $match: { buyerId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const submissionsQuery = { buyerId };
    if (startDate) {
      submissionsQuery.createdAt = { $gte: startDate };
    }

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
        .populate("productId", "title")
        .lean(),
      Dispute.countDocuments(submissionsQuery),
    ]);

    // Needs attention: oldest open disputes
    const needsAttention = await Dispute.find({ buyerId, status: "open" })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate("productId", "title")
      .select("category status createdAt reason amount")
      .lean();

    // Replaced top disputed sellers with something similar, or just keeping the same structure but querying by buyer's disputes.
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
    const activeDisputes = await Dispute.countDocuments({ buyerId, status: { $in: ["open", "under_review"] } });

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
        buyerName: req.user.name || 'You',
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
    console.error("Error in getBuyerDisputeAnalytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
