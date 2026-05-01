import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";

export const createDispute = async (req, res) => {
  try {
    const { orderId, category, reason } = req.body;

    if (!orderId || !category || !reason) {
      return res
        .status(400)
        .json({ message: "Order, category and reason are required" });
    }

    if (reason.trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Please describe your issue (minimum 10 characters)" });
    }

    const order = await Order.findById(orderId);

    if (!order || order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Invalid order" });
    }

    if (order.isRefunded) {
      return res
        .status(400)
        .json({ message: "Order is already refunded" });
    }

    const existingOpenDispute = await Dispute.findOne({
      orderId,
      buyerId: req.user.id,
      status: "open",
    });

    if (existingOpenDispute) {
      return res
        .status(400)
        .json({ message: "You already have an open dispute for this order" });
    }

    // Handle proof files if any were uploaded
    const proofFiles = (req.files || []).map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      // In production this would be a cloud storage URL; for now store name only
      url: file.originalname,
    }));

    await Dispute.create({
      orderId,
      buyerId: req.user.id,
      category,
      reason: reason.trim(),
      proofFiles,
    });

    res.json({ message: "Dispute submitted successfully" });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ message: "Failed to submit dispute" });
  }
};
