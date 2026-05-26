import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "./notification.controller.js";

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
        deletedFor: { $ne: user._id },
        status: { $ne: "placeholderDeleted" },
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
    const { message, attachments } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if ((!message || typeof message !== "string" || !message.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message or attachment is required" });
    }

    // Find any admin to route the conversation through
    const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

    if (!admin) {
      return res.status(400).json({ message: "No admin available" });
    }

    // When an admin sends in support-thread context, keep the same pattern
    const isAdminSender = user.role === "admin";
    const toUser = isAdminSender ? admin : admin; // for non-admins, to admin; for admin, still to admin for now

    // Get or generate supportTicketId
    let ticketId = null;
    const prevMessage = await ChatMessage.findOne({
      $or: [
        { from: user._id, toRole: "admin" },
        { to: user._id, fromRole: "admin" },
      ]
    }).select("supportTicketId").lean();

    if (prevMessage && prevMessage.supportTicketId) {
      ticketId = prevMessage.supportTicketId;
    } else {
      ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    }

    const chat = await ChatMessage.create({
      from: user._id,
      to: toUser._id,
      fromRole: user.role,
      toRole: toUser.role,
      supportTicketId: ticketId,
      message: message?.trim() || "",
      attachments: attachments || [],
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

    if (!isAdminSender) {
      await createNotification(
        toUser._id,
        "chat_message",
        `New support message from ${user.name}`,
        message?.trim() || "A new attachment was shared in support chat.",
        chat._id,
        "ChatMessage",
        {
          audienceRole: "admin",
          category: "chat",
          metadata: {
            senderId: String(user._id),
            senderRole: user.role,
          },
        }
      );
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { role: { $ne: "admin" } } },
      {
        $lookup: {
          from: "chatmessages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$from", "$$userId"] }, { $eq: ["$toRole", "admin"] }] },
                    { $and: [{ $eq: ["$to", "$$userId"] }, { $eq: ["$fromRole", "admin"] }] }
                  ]
                },
                status: { $ne: "placeholderDeleted" }
              }
            },
            { $sort: { createdAt: -1 } }
          ],
          as: "chats"
        }
      },
      {
        $project: {
          userId: "$_id",
          name: 1,
          role: 1,
          email: 1,
          createdAt: 1,
          lastMessage: { $arrayElemAt: ["$chats", 0] },
          unreadCount: {
            $size: {
              $filter: {
                input: "$chats",
                as: "chat",
                cond: {
                  $and: [
                    { $eq: ["$$chat.toRole", "admin"] },
                    { $not: { $in: [admin._id, { $ifNull: ["$$chat.readBy", []] }] } }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          name: 1,
          role: 1,
          email: 1,
          lastMessageAt: { $ifNull: ["$lastMessage.createdAt", "$createdAt"] },
          lastIncomingMessage: { $ifNull: ["$lastMessage.message", "No messages yet"] },
          lastIncomingAttachments: { $ifNull: ["$lastMessage.attachments", []] },
          lastIncomingAt: { $ifNull: ["$lastMessage.createdAt", "$createdAt"] },
          lastIncomingStatus: { $ifNull: ["$lastMessage.status", "active"] },
          lastIncomingIsDeleted: { $ifNull: ["$lastMessage.isDeleted", false] },
          unreadCount: 1
        }
      },
      { $sort: { lastMessageAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const conversations = await User.aggregate(pipeline);

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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;

    const messagesDesc = await ChatMessage.find({
      $or: [
        { from: userId, toRole: "admin" },
        { to: userId, fromRole: "admin" },
      ],
      deletedFor: { $ne: admin._id },
      status: { $ne: "placeholderDeleted" },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("from", "name role")
    .populate("to", "name role");

    const messages = messagesDesc.reverse();

    let avgResponseTime = null;
    let ticketId = null;

    if (page === 1) {
      const allMessages = await ChatMessage.find({
        $or: [
          { from: userId, toRole: "admin" },
          { to: userId, fromRole: "admin" },
        ],
        deletedFor: { $ne: admin._id },
        status: { $ne: "placeholderDeleted" },
      }).sort("createdAt");

      const pairs = [];
      for (let i = 0; i < allMessages.length - 1; i++) {
        if (allMessages[i].fromRole !== 'admin' && allMessages[i + 1].fromRole === 'admin') {
          pairs.push(allMessages[i + 1].createdAt - allMessages[i].createdAt);
        }
      }
      if (pairs.length > 0) {
        const avgMs = pairs.reduce((a, b) => a + b, 0) / pairs.length;
        avgResponseTime = Math.round(avgMs / 60000); // returns minutes
      }

      ticketId = allMessages.length > 0 ? (allMessages[0].supportTicketId || null) : null;
    }

    return res.json({ messages, avgResponseTime, ticketId });
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
    const { message, attachments } = req.body;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if ((!message || typeof message !== "string" || !message.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message or attachment is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get or generate supportTicketId
    let ticketId = null;
    const prevMessage = await ChatMessage.findOne({
      $or: [
        { from: user._id, toRole: "admin" },
        { to: user._id, fromRole: "admin" },
      ]
    }).select("supportTicketId").lean();

    if (prevMessage && prevMessage.supportTicketId) {
      ticketId = prevMessage.supportTicketId;
    } else {
      ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    }

    const chat = await ChatMessage.create({
      from: admin._id,
      to: user._id,
      fromRole: "admin",
      toRole: user.role,
      supportTicketId: ticketId,
      message: message?.trim() || "",
      attachments: attachments || [],
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

    await createNotification(
      user._id,
      "chat_message",
      "New admin message",
      message.trim(),
      chat._id,
      "ChatMessage",
      {
        audienceRole: user.role,
        category: "chat",
        metadata: {
          senderId: String(admin._id),
          senderRole: "admin",
        },
      }
    );

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

    // Notify the senders that their messages were read
    try {
      const io = getIO();
      // Emitting to everyone might be broad, but works to update admin dashboards
      io.emit("chat:messages-read", { readerId: String(user._id) });
    } catch (err) {
      console.error("markAllAsRead socket emit error", err);
    }

    return res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markAllAsRead error", err);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

// Admin: mark a specific user's thread as read
export const adminMarkThreadAsRead = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Mark all messages FROM this user TO admin as read by admin
    await ChatMessage.updateMany(
      {
        from: userId,
        toRole: "admin",
        readBy: { $ne: admin._id },
      },
      { $addToSet: { readBy: admin._id } }
    );

    try {
      const io = getIO();
      io.to(String(userId)).emit("chat:messages-read", { readerId: String(admin._id) });
    } catch (err) {
      console.error("adminMarkThreadAsRead socket emit error", err);
    }

    return res.json({ message: "Thread marked as read" });
  } catch (err) {
    console.error("adminMarkThreadAsRead error", err);
    return res.status(500).json({ message: "Failed to mark thread as read" });
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

    const messages = await ChatMessage.find({
      _id: { $in: messageIds },
    }).select("_id from to status isDeleted");

    const getCurrentStatus = (message) => {
      if (message.status) return message.status;
      return message.isDeleted ? "deleted" : "active";
    };

    const deletedIds = messages
      .filter((message) => getCurrentStatus(message) === "active")
      .map((message) => String(message._id));
    const placeholderDeletedIds = messages
      .filter((message) => getCurrentStatus(message) === "deleted")
      .map((message) => String(message._id));

    if (deletedIds.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: deletedIds } },
        {
          $set: {
            status: "deleted",
            isDeleted: true,
          },
        }
      );
    }

    if (placeholderDeletedIds.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: placeholderDeletedIds } },
        {
          $set: {
            status: "placeholderDeleted",
            isDeleted: true,
          },
        }
      );
    }

    try {
      const io = getIO();
      if (messages.length > 0) {
        const participantIds = new Set();
        messages.forEach((message) => {
          participantIds.add(String(message.from));
          participantIds.add(String(message.to));
        });

        let room = io;
        participantIds.forEach((participantId) => {
          room = room.to(participantId);
        });
        room.emit("chat:messages-status-updated", [
          ...deletedIds.map((_id) => ({ _id, status: "deleted" })),
          ...placeholderDeletedIds.map((_id) => ({
            _id,
            status: "placeholderDeleted",
          })),
        ]);
      }
    } catch (err) {
      console.error("adminDeleteMessages socket emit error", err);
    }

    return res.json({
      message: "Messages deleted",
      updates: [
        ...deletedIds.map((_id) => ({ _id, status: "deleted" })),
        ...placeholderDeletedIds.map((_id) => ({
          _id,
          status: "placeholderDeleted",
        })),
      ],
    });
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

export const uploadAttachment = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    const resource_type = file.mimetype.startsWith("image/") ? "image" : "raw";

    const uploadResult = await new Promise((resolve, reject) => {
      const result = cloudinary.uploader.upload_stream(
        {
          resource_type,
          folder: "sellify/chat_attachments",
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      result.end(file.buffer);
    });

    return res.status(200).json({
      url: uploadResult.secure_url,
      type: file.mimetype,
      name: file.originalname,
    });
  } catch (err) {
    console.error("uploadAttachment error", err);
    return res.status(500).json({ message: "Failed to upload attachment" });
  }
};

// Soft delete messages
export const deleteMessages = async (req, res) => {
  try {
    const user = req.user;
    const { messageIds } = req.body;

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "messageIds array is required" });
    }

    const messages = await ChatMessage.find({
      _id: { $in: messageIds },
    }).select("_id from to status isDeleted");

    const getCurrentStatus = (message) => {
      if (message.status) return message.status;
      return message.isDeleted ? "deleted" : "active";
    };

    const deletedIds = messages
      .filter((message) => getCurrentStatus(message) === "active")
      .map((message) => String(message._id));
    const placeholderDeletedIds = messages
      .filter((message) => getCurrentStatus(message) === "deleted")
      .map((message) => String(message._id));

    if (deletedIds.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: deletedIds } },
        {
          $set: {
            status: "deleted",
            isDeleted: true,
          },
        }
      );
    }

    if (placeholderDeletedIds.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: placeholderDeletedIds } },
        {
          $set: {
            status: "placeholderDeleted",
            isDeleted: true,
          },
        }
      );
    }

    try {
      const io = getIO();
      if (messages.length > 0) {
        const participantIds = new Set();
        messages.forEach((message) => {
          participantIds.add(String(message.from));
          participantIds.add(String(message.to));
        });

        let room = io;
        participantIds.forEach((participantId) => {
          room = room.to(participantId);
        });
        room.emit("chat:messages-status-updated", [
          ...deletedIds.map((_id) => ({ _id, status: "deleted" })),
          ...placeholderDeletedIds.map((_id) => ({
            _id,
            status: "placeholderDeleted",
          })),
        ]);
      }
    } catch (err) {
      console.error("deleteMessages socket emit error", err);
    }

    return res.json({
      message: "Messages deleted",
      updates: [
        ...deletedIds.map((_id) => ({ _id, status: "deleted" })),
        ...placeholderDeletedIds.map((_id) => ({
          _id,
          status: "placeholderDeleted",
        })),
      ],
    });
  } catch (err) {
    console.error("deleteMessages error", err);
    return res.status(500).json({ message: "Failed to delete messages" });
  }
};
