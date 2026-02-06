import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import {
  getSupportThread,
  sendSupportMessage,
  adminListConversations,
  adminGetThread,
  adminSendMessage,
  getUnreadCount,
  markAllAsRead,
  adminDeleteMessages,
  adminClearThread,
  adminClearAllChats,
} from "../controllers/chat.controller.js";

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Buyer/Seller (and admin if needed) support thread
router.get("/support-thread", requireRole(["buyer", "seller", "admin"]), getSupportThread);
router.post("/support-thread", requireRole(["buyer", "seller", "admin"]), sendSupportMessage);

// Unread helpers
router.get("/unread-count", requireRole(["buyer", "seller", "admin"]), getUnreadCount);
router.post("/mark-read", requireRole(["buyer", "seller", "admin"]), markAllAsRead);

// Admin-only routes
router.get("/conversations", requireRole(["admin"]), adminListConversations);
router.get("/thread/:userId", requireRole(["admin"]), adminGetThread);
router.post("/thread/:userId", requireRole(["admin"]), adminSendMessage);
router.delete("/admin/messages", requireRole(["admin"]), adminDeleteMessages);
router.delete("/admin/thread/:userId", requireRole(["admin"]), adminClearThread);
router.delete("/admin/all", requireRole(["admin"]), adminClearAllChats);

export default router;
