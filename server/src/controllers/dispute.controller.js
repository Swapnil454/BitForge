import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";
import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";

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

    const dispute = await Dispute.create({
      orderId,
      buyerId: req.user.id,
      category,
      reason: reason.trim(),
      proofFiles,
    });

    await createNotification(
      req.user.id,
      "dispute_created",
      "Dispute submitted",
      "Your dispute has been submitted and is now awaiting review by the admin team.",
      dispute._id,
      "Dispute",
      {
        audienceRole: "buyer",
      }
    );

    if (order.sellerId) {
      await createNotification(
        order.sellerId,
        "dispute_created",
        "A buyer raised a dispute",
        "One of your orders has a new dispute and may require admin review.",
        dispute._id,
        "Dispute",
        {
          audienceRole: "seller",
        }
      );
    }

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin._id,
          "dispute_created",
          "New dispute opened",
          `A new dispute was raised for order ${order._id}.`,
          dispute._id,
          "Dispute",
          {
            audienceRole: "admin",
          }
        )
      )
    );

    res.json({ message: "Dispute submitted successfully" });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ message: "Failed to submit dispute" });
  }
};
