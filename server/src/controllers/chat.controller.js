import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";

// Fetch support thread for current buyer/seller with any admin
export const getSupportThread = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["buyer", "seller", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Unsupported role" });
    }

    const messages = await ChatMessage.find({
      $or: [
        { from: user._id, toRole: "admin" },
        { to: user._id, fromRole: "admin" },
      ],
    })
      .sort("createdAt")
      .populate("from", "name role")
      .populate("to", "name role");

    return res.json({ messages });
  } catch (err) {
    console.error("getSupportThread error", err);
    return res.status(500).json({ message: "Failed to load chat" });
  }
};

// Send message from buyer/seller to an admin (or admin replying in their own view)
export const sendSupportMessage = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find any admin to route the conversation through
    const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

    if (!admin) {
      return res.status(400).json({ message: "No admin available" });
    }

    // When an admin sends in support-thread context, keep the same pattern
    const isAdminSender = user.role === "admin";
    const toUser = isAdminSender ? admin : admin; // for non-admins, to admin; for admin, still to admin for now

    const chat = await ChatMessage.create({
      from: user._id,
      to: toUser._id,
      fromRole: user.role,
      toRole: toUser.role,
      message: message.trim(),
      readBy: [user._id],
    });

    // In Mongoose 7+, doc.populate returns a promise; populate both refs explicitly
    await chat.populate([{ path: "from", select: "name role" }, { path: "to", select: "name role" }]);
    const populated = chat;

    // Broadcast new message in real time to both participants
    try {
      const io = getIO();
      const fromId = String(populated.from._id);
      const toId = String(populated.to._id);
      io.to(fromId).to(toId).emit("chat:new-message", populated);
    } catch (err) {
      // Socket layer not critical for HTTP success; fail silently
      console.error("sendSupportMessage socket emit error", err.message || err);
    }

    return res.status(201).json({ message: "Sent", chat: populated });
  } catch (err) {
    console.error("sendSupportMessage error", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
};

// ===== Admin-specific endpoints =====

// List distinct users (buyers/sellers) who have support chats
export const adminListConversations = async (req, res) => {
  try {
    const admin = req.user;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const pipeline = [
      {
        $match: {
          $or: [
            { fromRole: { $ne: "admin" }, toRole: "admin" },
            { toRole: { $ne: "admin" }, fromRole: "admin" },
          ],
        },
      },
      {
        $addFields: {
          userId: {
            $cond: [
              { $ne: ["$fromRole", "admin"] },
              "$from",
              "$to",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ];

    const results = await ChatMessage.aggregate(pipeline);

    const userIds = results.map((r) => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "name role email"
    );

    const conversations = results.map((r) => {
      const user = users.find((u) => u._id.equals(r._id));
      return {
        userId: r._id,
        name: user?.name || "Unknown",
        role: user?.role || "buyer",
        email: user?.email || "",
        lastMessageAt: r.lastMessageAt,
      };
    });

    return res.json({ conversations });
  } catch (err) {
    console.error("adminListConversations error", err);
    return res.status(500).json({ message: "Failed to load conversations" });
  }
};

// Get full thread between admin(s) and a specific user
export const adminGetThread = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await ChatMessage.find({
      $or: [
        { from: userId, toRole: "admin" },
        { to: userId, fromRole: "admin" },
      ],
    })
      .sort("createdAt")
      .populate("from", "name role")
      .populate("to", "name role");

    return res.json({ messages });
  } catch (err) {
    console.error("adminGetThread error", err);
    return res.status(500).json({ message: "Failed to load thread" });
  }
};

// Admin sends message to a specific user
export const adminSendMessage = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;
    const { message } = req.body;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const chat = await ChatMessage.create({
      from: admin._id,
      to: user._id,
      fromRole: "admin",
      toRole: user.role,
      message: message.trim(),
      readBy: [admin._id],
    });

    await chat.populate([{ path: "from", select: "name role" }, { path: "to", select: "name role" }]);
    const populated = chat;

    // Broadcast new message to both admin and user rooms
    try {
      const io = getIO();
      const fromId = String(populated.from._id);
      const toId = String(populated.to._id);
      io.to(fromId).to(toId).emit("chat:new-message", populated);
    } catch (err) {
      console.error("adminSendMessage socket emit error", err.message || err);
    }

    return res.status(201).json({ message: "Sent", chat: populated });
  } catch (err) {
    console.error("adminSendMessage error", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
};

// Unread count for current user (buyer, seller, or admin)
export const getUnreadCount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const count = await ChatMessage.countDocuments({
      to: user._id,
      readBy: { $ne: user._id },
    });

    return res.json({ count });
  } catch (err) {
    console.error("getUnreadCount error", err);
    return res.status(500).json({ message: "Failed to get unread count" });
  }
};

// Mark all messages involving current user as read
export const markAllAsRead = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await ChatMessage.updateMany(
      {
        to: user._id,
        readBy: { $ne: user._id },
      },
      { $addToSet: { readBy: user._id } }
    );

    return res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAllAsRead error", err);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

// Admin: delete specific messages by id array
export const adminDeleteMessages = async (req, res) => {
  try {
    const admin = req.user;
    const { messageIds } = req.body;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "messageIds array is required" });
    }

    await ChatMessage.deleteMany({
      _id: { $in: messageIds },
    });

    return res.json({ message: "Messages deleted" });
  } catch (err) {
    console.error("adminDeleteMessages error", err);
    return res.status(500).json({ message: "Failed to delete messages" });
  }
};

// Admin: clear entire thread with a specific user
export const adminClearThread = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await ChatMessage.deleteMany({
      $or: [
        { from: userId, toRole: "admin" },
        { to: userId, fromRole: "admin" },
      ],
    });

    return res.json({ message: "Thread cleared" });
  } catch (err) {
    console.error("adminClearThread error", err);
    return res.status(500).json({ message: "Failed to clear thread" });
  }
};

// Admin: clear all chats between admins and buyers/sellers
export const adminClearAllChats = async (_req, res) => {
  try {
    await ChatMessage.deleteMany({
      $or: [{ fromRole: "admin" }, { toRole: "admin" }],
    });

    return res.json({ message: "All admin chats cleared" });
  } catch (err) {
    console.error("adminClearAllChats error", err);
    return res.status(500).json({ message: "Failed to clear all chats" });
  }
};
