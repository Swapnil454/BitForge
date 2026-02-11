import Dispute from "../models/Dispute.js";
import Order from "../models/Order.js";

export const getBuyerDisputes = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const disputes = await Dispute.find({ buyerId })
      .sort({ createdAt: -1 })
      .populate({
        path: "orderId",
        populate: [
          { path: "productId", select: "title" },
          { path: "sellerId", select: "name email" },
        ],
      });

    const formatted = disputes.map((dispute) => {
      const order = dispute.orderId;
      const product = order && order.productId;
      const seller = order && order.sellerId;

      return {
        _id: dispute._id,
        orderId: order ? order._id : null,
        productName: product && product.title ? product.title : "Product",
        sellerName:
          seller && (seller.name || seller.email) ? seller.name || seller.email : "Unknown seller",
        amount: order && typeof order.amount === "number" ? order.amount : 0,
        reason: dispute.reason,
        status: dispute.status,
        adminNote: dispute.adminNote || "",
        createdAt: dispute.createdAt,
      };
    });

    res.json({ disputes: formatted });
  } catch (error) {
    console.error("Error fetching buyer disputes:", error);
    res.status(500).json({ message: "Failed to load disputes" });
  }
};
