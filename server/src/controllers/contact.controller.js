import User from "../models/User.js";
import Inquiry from "../models/Inquiry.js";
import { createNotification } from "./notification.controller.js";

// Public contact endpoint: store message in DB and notify admins
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, type = "support", message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    const safeType = ["support", "sales", "partnerships", "other"].includes(type)
      ? type
      : "support";

    // ── 1. Persist to DB ─────────────────────────────────────────────────────
    await Inquiry.create({ name, email, type: safeType, message });

    // ── 2. Notify admins ─────────────────────────────────────────────────────
    const admins = await User.find({ role: "admin" }).select("_id email").lean();

    if (admins && admins.length > 0) {
      const title = `New ${safeType} enquiry from ${name}`;
      const baseMessage = [
        `From: ${name} <${email}>`,
        `Type: ${safeType}`,
        "",
        message,
      ].join("\n");

      await Promise.all(
        admins.map((admin) =>
          createNotification(admin._id, "contact_message", title, baseMessage)
        )
      );
    }

    return res.status(201).json({ message: "Contact message submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return res.status(500).json({ message: "Failed to submit contact message" });
  }
};

// Admin: list all inquiries (newest first) with optional pagination + search
export const getInquiries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 7);
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const search = req.query.search?.trim();

    const filter = {};
    if (type && type !== "all") filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Inquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      inquiries,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: skip + inquiries.length < total,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return res.status(500).json({ message: "Failed to fetch inquiries" });
  }
};

// Admin: delete one inquiry by ID
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    return res.status(200).json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return res.status(500).json({ message: "Failed to delete inquiry" });
  }
};

// Admin: mark inquiry as read
export const markInquiryRead = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    return res.status(200).json({ inquiry });
  } catch (error) {
    console.error("Error marking inquiry as read:", error);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
};
