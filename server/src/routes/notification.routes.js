import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteBulkNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushToken,
  unregisterPushToken,
  updateNotificationHeartbeat,
} from "../controllers/notification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get("/", getUserNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Preferences / push sync
router.get("/preferences", getNotificationPreferences);
router.patch("/preferences", updateNotificationPreferences);
router.post("/push-token", registerPushToken);
router.delete("/push-token", unregisterPushToken);
router.post("/heartbeat", updateNotificationHeartbeat);

// Mark notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// Mark all as read
router.patch("/all/mark-as-read", markAllAsRead);

// Delete bulk notifications
router.post("/bulk-delete", deleteBulkNotifications);

// Delete notification
router.delete("/:notificationId", deleteNotification);

export default router;
