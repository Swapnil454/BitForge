import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";

let ioInstance = null;

export const initSocket = (httpServer) => {
  if (ioInstance) return ioInstance;

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
    : undefined;

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || (allowedOrigins && allowedOrigins.includes(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      const user = await User.findById(userId).select("name role");
      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      socket.join(String(user._id));
      if (user.role === 'admin' || user.role === 'superadmin') {
        socket.join('admins');
      }
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-ticket", (ticketId) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });

    socket.on("leave-ticket", (ticketId) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
      }
    });

    socket.on('ticket:mark-delivered', async ({ msgId }) => {
      try {
        const msg = await ChatMessage.findById(msgId);
        if (!msg) return;

        // Ensure msg.from exists before comparing
        const senderIdStr = msg.from ? msg.from.toString() : null;
        if (senderIdStr === String(socket.user?._id)) return;

        if (msg.deliveredAt) return;

        const now = new Date();
        await ChatMessage.findByIdAndUpdate(msgId, { deliveredAt: now });

        io.to(`ticket:${msg.ticketId}`).emit('ticket:message-status-update', {
          msgIds: [msgId],
          status: 'delivered',
          deliveredAt: now,
          userId: String(socket.user?._id)
        });
      } catch (err) {
        console.error("mark-delivered error:", err);
      }
    });

    socket.on('ticket:mark-read', async ({ ticketId, msgIds }) => {
      try {
        if (!msgIds || msgIds.length === 0) return;
        const now = new Date();
        
        const userIdStr = String(socket.user?._id);

        await ChatMessage.updateMany(
          {
            _id: { $in: msgIds },
            from: { $ne: socket.user?._id }, 
            readBy: { $ne: socket.user?._id } 
          },
          {
            $addToSet: { readBy: socket.user?._id },
            $set: { readAt: now }
          }
        );

        io.to(`ticket:${ticketId}`).emit('ticket:message-status-update', {
          msgIds,
          status: 'read',
          readAt: now,
          userId: userIdStr
        });
      } catch (err) {
        console.error("mark-read error:", err);
      }
    });

    socket.on("disconnect", () => {
      // Socket disconnected
    });
  });

  ioInstance = io;
  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};
