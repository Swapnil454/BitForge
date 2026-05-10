import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";
import {
  hasFirebasePushCredentials,
  sendFirebasePush,
} from "../utils/firebasePush.js";

const DEFAULT_SOURCE = {
  name: "BitForge",
  logoUrl: "/icon.png",
};

const sanitizeNotificationText = (value) =>
  String(value || "")
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const NOTIFICATION_BLUEPRINTS = {
  order_completed: {
    category: "transaction",
    priority: "high",
    actionLabel: "View purchase",
    actionByRole: {
      buyer: "/dashboard/buyer/purchases",
      admin: "/dashboard/admin/transactions",
    },
  },
  payment_received: {
    category: "transaction",
    priority: "high",
    actionLabel: "View sales",
    actionByRole: {
      seller: "/dashboard/seller/sales",
      admin: "/dashboard/admin/transactions",
    },
  },
  payment_failed: {
    category: "transaction",
    priority: "high",
    actionLabel: "Review payment",
    actionByRole: {
      buyer: "/dashboard/buyer/transactions",
      admin: "/dashboard/admin/transactions",
    },
  },
  payout_sent: {
    category: "payout",
    priority: "high",
    actionLabel: "View payout",
    actionByRole: {
      seller: "/dashboard/seller/transactions",
      admin: "/dashboard/admin/payouts",
    },
  },
  payout_rejected: {
    category: "payout",
    priority: "high",
    actionLabel: "View payout",
    actionByRole: {
      seller: "/dashboard/seller/transactions",
      admin: "/dashboard/admin/payouts",
    },
  },
  seller_account_approved: {
    category: "account",
    priority: "high",
    actionLabel: "Open dashboard",
    actionByRole: {
      seller: "/dashboard/seller",
    },
  },
  seller_account_rejected: {
    category: "account",
    priority: "high",
    actionLabel: "Review account",
    actionByRole: {
      seller: "/dashboard/settings?tab=account",
    },
  },
  product_approved: {
    category: "moderation",
    priority: "normal",
    actionLabel: "Open product",
    actionByRole: {
      seller: "/dashboard/seller/products",
      buyer: "/marketplace",
      admin: "/dashboard/admin/products",
    },
  },
  product_rejected: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review product",
    actionByRole: {
      seller: "/dashboard/seller/products",
      admin: "/dashboard/admin/products",
    },
  },
  product_pending_review: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review queue",
    actionByRole: {
      admin: "/dashboard/admin/products",
    },
  },
  product_update_requested: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review request",
    actionByRole: {
      admin: "/dashboard/admin/products",
    },
  },
  product_deletion_requested: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review request",
    actionByRole: {
      admin: "/dashboard/admin/products",
    },
  },
  product_change_approved: {
    category: "moderation",
    priority: "normal",
    actionLabel: "Open product",
    actionByRole: {
      seller: "/dashboard/seller/products",
      buyer: "/marketplace",
    },
  },
  product_change_rejected: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review product",
    actionByRole: {
      seller: "/dashboard/seller/products",
    },
  },
  product_edited_by_admin: {
    category: "moderation",
    priority: "high",
    actionLabel: "View changes",
    actionByRole: {
      seller: "/dashboard/seller/products",
    },
  },
  product_deleted_by_admin: {
    category: "moderation",
    priority: "high",
    actionLabel: "Open products",
    actionByRole: {
      seller: "/dashboard/seller/products",
    },
  },
  new_seller_registration: {
    category: "moderation",
    priority: "high",
    actionLabel: "Review seller",
    actionByRole: {
      admin: "/dashboard/admin/sellers",
    },
  },
  seller_deletion_requested: {
    category: "account",
    priority: "high",
    actionLabel: "Review request",
    actionByRole: {
      admin: "/dashboard/admin/seller-deletions",
    },
  },
  seller_deletion_approved: {
    category: "account",
    priority: "high",
    actionLabel: "Account settings",
    actionByRole: {
      seller: "/dashboard/settings?tab=account",
    },
  },
  seller_deletion_rejected: {
    category: "account",
    priority: "high",
    actionLabel: "Account settings",
    actionByRole: {
      seller: "/dashboard/settings?tab=account",
    },
  },
  dispute_created: {
    category: "dispute",
    priority: "high",
    actionLabel: "Open dispute",
    actionByRole: {
      buyer: "/dashboard/buyer/disputes",
      seller: "/dashboard/seller/reports",
      admin: "/dashboard/admin/disputes",
    },
  },
  dispute_resolved: {
    category: "dispute",
    priority: "high",
    actionLabel: "Open dispute",
    actionByRole: {
      buyer: "/dashboard/buyer/disputes",
      seller: "/dashboard/seller/reports",
      admin: "/dashboard/admin/disputes",
    },
  },
  dispute_rejected: {
    category: "dispute",
    priority: "high",
    actionLabel: "Open dispute",
    actionByRole: {
      buyer: "/dashboard/buyer/disputes",
      seller: "/dashboard/seller/reports",
      admin: "/dashboard/admin/disputes",
    },
  },
  chat_message: {
    category: "chat",
    priority: "high",
    actionLabel: "Open chat",
    actionByRole: {
      buyer: "/dashboard/buyer/help-center",
      seller: "/dashboard/seller/help-center",
      admin: "/dashboard/admin/help-center",
    },
  },
  password_changed: {
    category: "security",
    priority: "urgent",
    actionLabel: "Review security",
    actionByRole: {
      buyer: "/dashboard/settings?tab=security",
      seller: "/dashboard/settings?tab=security",
      admin: "/dashboard/settings?tab=security",
    },
  },
  password_reset: {
    category: "security",
    priority: "urgent",
    actionLabel: "Review security",
    actionByRole: {
      buyer: "/dashboard/settings?tab=security",
      seller: "/dashboard/settings?tab=security",
      admin: "/dashboard/settings?tab=security",
    },
  },
  account_banned_by_admin: {
    category: "account",
    priority: "urgent",
    actionLabel: "Contact support",
    actionByRole: {
      buyer: "/report",
      seller: "/report",
      admin: "/dashboard/admin/users",
    },
  },
  account_unbanned_by_admin: {
    category: "account",
    priority: "high",
    actionLabel: "Open dashboard",
    actionByRole: {
      buyer: "/dashboard/buyer",
      seller: "/dashboard/seller",
      admin: "/dashboard/admin",
    },
  },
  profile_edited_by_admin: {
    category: "account",
    priority: "normal",
    actionLabel: "Review profile",
    actionByRole: {
      buyer: "/dashboard/settings?tab=profile",
      seller: "/dashboard/settings?tab=profile",
      admin: "/dashboard/settings?tab=profile",
    },
  },
  contact_message: {
    category: "support",
    priority: "normal",
    actionLabel: "Open support",
    actionByRole: {
      admin: "/dashboard/admin/notifications",
    },
  },
  identity_verified: {
    category: "moderation",
    priority: "normal",
    actionLabel: "Open seller dashboard",
    actionByRole: {
      seller: "/dashboard/seller",
    },
  },
  identity_rejected: {
    category: "moderation",
    priority: "high",
    actionLabel: "Open support",
    actionByRole: {
      seller: "/dashboard/seller/help-center",
    },
  },
  promo_buyer_digest: {
    category: "promotion",
    priority: "low",
    actionLabel: "Explore marketplace",
    actionByRole: {
      buyer: "/marketplace",
    },
  },
  admin_purchase_alert: {
    category: "transaction",
    priority: "normal",
    actionLabel: "View transactions",
    actionByRole: {
      admin: "/dashboard/admin/transactions",
    },
  },
  user_deleted: {
    category: "account",
    priority: "normal",
    actionLabel: "Open notifications",
    actionByRole: {
      admin: "/dashboard/admin/notifications",
    },
  },
};

const buildAbsoluteLink = (actionUrl) => {
  if (!actionUrl) return undefined;
  if (/^https?:\/\//i.test(actionUrl)) return actionUrl;

  const baseUrl =
    process.env.CLIENT_URL?.split(",").map((value) => value.trim()).filter(Boolean)[0] ||
    process.env.PUBLIC_APP_URL ||
    "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}${actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`}`;
};

const getUserSettingForCategory = (user, category) => {
  const settings = user.notificationSettings || {};

  switch (category) {
    case "promotion":
      return settings.marketingEnabled !== false;
    case "security":
      return settings.securityEnabled !== false;
    case "transaction":
    case "payout":
    case "dispute":
      return settings.transactionEnabled !== false;
    case "chat":
      return settings.chatEnabled !== false;
    case "moderation":
      return settings.moderationEnabled !== false;
    default:
      return true;
  }
};

const isUserInactiveForPush = (user, windowMs = 5 * 60 * 1000) => {
  if (!user?.lastActiveAt) return true;
  return Date.now() - new Date(user.lastActiveAt).getTime() > windowMs;
};

const resolveBlueprint = (user, type, options = {}, relatedModel = null) => {
  const effectiveType =
    type === "product_rejected" && relatedModel === "User" && user.role === "seller"
      ? "seller_account_rejected"
      : type;

  const baseBlueprint = NOTIFICATION_BLUEPRINTS[effectiveType] || {};
  const audienceRole = options.audienceRole || user.role;
  const actionUrl =
    options.actionUrl ||
    baseBlueprint.actionUrl ||
    baseBlueprint.actionByRole?.[audienceRole] ||
    (audienceRole === "admin"
      ? "/dashboard/admin/notifications"
      : audienceRole === "seller"
        ? "/dashboard/seller/notifications"
        : "/notifications");

  return {
    audienceRole,
    category: options.category || baseBlueprint.category || "system",
    priority: options.priority || baseBlueprint.priority || "normal",
    actionLabel: options.actionLabel || baseBlueprint.actionLabel || "Open",
    actionUrl,
    source: {
      ...DEFAULT_SOURCE,
      ...(baseBlueprint.source || {}),
      ...(options.source || {}),
    },
  };
};

const emitRealtimeNotification = (userId, notification) => {
  try {
    const io = getIO();
    io.to(String(userId)).emit("notification:new", notification);
  } catch (error) {
    console.error("Notification socket emit error:", error.message || error);
  }
};

const deliverPushIfEligible = async (user, notification, options = {}) => {
  const browserPushEnabled = user.notificationSettings?.browserPushEnabled !== false;
  const categoryEnabled = getUserSettingForCategory(user, notification.category);
  const tokens = (user.pushSubscriptions || [])
    .filter((entry) => entry.isActive && entry.token)
    .map((entry) => entry.token);

  if (!browserPushEnabled || !categoryEnabled) {
    return {
      status: "disabled",
      channels: { inApp: true, push: false },
    };
  }

  if (!hasFirebasePushCredentials()) {
    return {
      status: "disabled",
      channels: { inApp: true, push: false },
    };
  }

  if (tokens.length === 0) {
    return {
      status: "skipped",
      channels: { inApp: true, push: false },
    };
  }

  const onlyWhenInactive = options.pushWhenInactiveOnly !== false;
  if (onlyWhenInactive && !isUserInactiveForPush(user)) {
    return {
      status: "skipped",
      channels: { inApp: true, push: false },
    };
  }

  const link = buildAbsoluteLink(notification.actionUrl);
  const attempts = await Promise.all(
    tokens.map((token) =>
      sendFirebasePush({
        token,
        title: notification.title,
        body: notification.message,
        link,
        data: {
          notificationId: String(notification._id),
          type: notification.type,
          category: notification.category,
          actionUrl: notification.actionUrl,
          priority: notification.priority,
        },
      }).catch((error) => ({
        ok: false,
        skipped: false,
        error: error.message || String(error),
      }))
    )
  );

  const success = attempts.find((attempt) => attempt.ok);
  if (success) {
    return {
      status: "sent",
      messageId: success.messageId,
      channels: { inApp: true, push: true },
    };
  }

  const failure = attempts.find((attempt) => !attempt.skipped);
  return {
    status: failure ? "failed" : "skipped",
    error: failure?.error,
    channels: { inApp: true, push: false },
  };
};

export const ensurePromotionalNotificationForUser = async (user) => {
  if (!user || user.role !== "buyer") return;
  if (user.notificationSettings?.marketingEnabled === false) return;

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentPromo = await Notification.findOne({
    userId: user._id,
    type: "promo_buyer_digest",
    createdAt: { $gte: fortyEightHoursAgo },
  }).select("_id");

  if (recentPromo) return;

  await createNotification(
    user._id,
    "promo_buyer_digest",
    "Discover new products on BitForge",
    "Fresh creator uploads and marketplace picks are waiting for you.",
    null,
    null,
    {
      audienceRole: "buyer",
      actionUrl: "/marketplace",
      actionLabel: "Explore marketplace",
      category: "promotion",
      priority: "low",
      pushWhenInactiveOnly: true,
      metadata: {
        automated: true,
      },
    }
  );
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await ensurePromotionalNotificationForUser(req.user);

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
      .skip(skip)
      .lean();

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

export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationSettings pushSubscriptions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      notificationSettings: user.notificationSettings || {},
      pushEnabled: (user.pushSubscriptions || []).some((entry) => entry.isActive),
      pushSubscriptionCount: (user.pushSubscriptions || []).filter((entry) => entry.isActive).length,
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const allowedKeys = [
      "browserPushEnabled",
      "marketingEnabled",
      "securityEnabled",
      "transactionEnabled",
      "chatEnabled",
      "moderationEnabled",
    ];

    const updates = {};
    for (const key of allowedKeys) {
      if (typeof req.body[key] === "boolean") {
        updates[`notificationSettings.${key}`] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...updates,
        lastActiveAt: new Date(),
      },
      { new: true }
    ).select("notificationSettings");

    res.json({
      message: "Notification preferences updated",
      notificationSettings: user?.notificationSettings || {},
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
};

export const registerPushToken = async (req, res) => {
  try {
    const { token, deviceId, platform, browserName } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Push token is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const existing = (user.pushSubscriptions || []).find((entry) => entry.token === token);

    if (existing) {
      existing.deviceId = deviceId || existing.deviceId;
      existing.platform = platform || existing.platform;
      existing.browserName = browserName || existing.browserName;
      existing.userAgent = req.headers["user-agent"] || existing.userAgent;
      existing.isActive = true;
      existing.updatedAt = now;
    } else {
      user.pushSubscriptions.push({
        token,
        deviceId: deviceId || undefined,
        platform: platform || undefined,
        browserName: browserName || undefined,
        userAgent: req.headers["user-agent"] || "",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    user.lastActiveAt = now;
    user.notificationSettings = {
      ...(user.notificationSettings?.toObject?.() || user.notificationSettings || {}),
      browserPushEnabled: true,
    };

    await user.save();

    res.json({
      message: "Push token registered",
      pushEnabled: true,
    });
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json({ message: "Failed to register push token" });
  }
};

export const unregisterPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Push token is required" });
    }

    await User.updateOne(
      { _id: req.user.id, "pushSubscriptions.token": token },
      {
        $set: {
          "pushSubscriptions.$.isActive": false,
          "pushSubscriptions.$.updatedAt": new Date(),
        },
      }
    );

    res.json({ message: "Push token removed" });
  } catch (error) {
    console.error("Error unregistering push token:", error);
    res.status(500).json({ message: "Failed to unregister push token" });
  }
};

export const updateNotificationHeartbeat = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastActiveAt: new Date(),
    });

    await ensurePromotionalNotificationForUser(req.user);

    res.json({ message: "Heartbeat recorded" });
  } catch (error) {
    console.error("Error updating notification heartbeat:", error);
    res.status(500).json({ message: "Failed to update heartbeat" });
  }
};

export const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId = null,
  relatedModel = null,
  options = {}
) => {
  try {
    const user = await User.findById(userId).select(
      "role notificationSettings pushSubscriptions lastActiveAt"
    );

    if (!user) {
      return null;
    }

    const blueprint = resolveBlueprint(user, type, options, relatedModel);

    const notification = await Notification.create({
      userId,
      type,
      category: blueprint.category,
      audienceRole: blueprint.audienceRole,
      title: sanitizeNotificationText(title),
      message: sanitizeNotificationText(message),
      actionUrl: blueprint.actionUrl,
      actionLabel: blueprint.actionLabel,
      relatedId,
      relatedModel,
      priority: blueprint.priority,
      source: blueprint.source,
      metadata: options.metadata || {},
      channels: {
        inApp: true,
        push: false,
      },
      pushDelivery: {
        status: "disabled",
      },
    });

    const pushResult = await deliverPushIfEligible(user, notification, options);
    notification.channels = pushResult.channels;
    notification.pushDelivery = {
      status: pushResult.status,
      messageId: pushResult.messageId,
      error: pushResult.error,
      lastAttemptAt:
        pushResult.status === "sent" || pushResult.status === "failed"
          ? new Date()
          : undefined,
    };

    await notification.save();

    emitRealtimeNotification(userId, notification.toObject());
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
