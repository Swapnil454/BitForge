import User from "../models/User.js";
import { createNotification } from "./notification.controller.js";

// Public contact endpoint: store message and notify admins
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, type = "support", message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    // Find all admin users to notify
    const admins = await User.find({ role: "admin" }).select("_id email").lean();

    if (!admins || admins.length === 0) {
      return res.status(200).json({ message: "Contact received, but no admin users are configured yet." });
    }

    const safeType = typeof type === "string" && type ? type : "support";
    const title = `New ${safeType} enquiry via contact form`;

    const baseMessage = [
      `From: ${name} <${email}>`,
      `Type: ${safeType}`,
      "",
      message,
    ].join("\n");

    // Create a notification for each admin
    await Promise.all(
      admins.map((admin) =>
        createNotification(admin._id, "contact_message", title, baseMessage)
      )
    );

    return res.status(201).json({ message: "Contact message submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return res.status(500).json({ message: "Failed to submit contact message" });
  }
};
