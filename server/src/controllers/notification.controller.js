import Notification from "../models/Notification.js";

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const hasPageParam = req.query.page !== undefined;
    const parsedPage = Number.parseInt(req.query.page, 10);
    let page = hasPageParam && Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const parsedSkip = Number.parseInt(req.query.skip, 10);
    let skip = Number.isFinite(parsedSkip) && parsedSkip >= 0
      ? parsedSkip
      : (page - 1) * limit;

    if (!hasPageParam) {
      page = Math.floor(skip / limit) + 1;
    }

    const [total, unreadCount] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (hasPageParam && page > totalPages) {
      page = totalPages;
      skip = (page - 1) * limit;
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      notifications,
      total,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// Create notification (internal use)
export const createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const iconMap = {
      order_completed: "",
      download_ready: "⬇️",
      product_approved: "🎉",
      product_rejected: "",
      product_pending_review: "",
      product_update_requested: "",
      product_deletion_requested: "🗑️",
      product_change_approved: "",
      product_change_rejected: "",
      price_drop: "📉",
      payment_received: "💰",
      payout_sent: "🏦",
      user_deleted: "🗑️",
      seller_deletion_requested: "",
      seller_deletion_approved: "",
      seller_deletion_rejected: "",
      account_deleted_by_admin: "🚫",
      profile_edited_by_admin: "✏️",
      contact_message: "📨",
    };

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      icon: iconMap[type] || "📬",
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
