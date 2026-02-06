import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get("/", getUserNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// Mark all as read
router.patch("/all/mark-as-read", markAllAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

export default router;
