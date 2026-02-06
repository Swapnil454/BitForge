import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let ioInstance = null;

export const initSocket = (httpServer) => {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
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
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
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
