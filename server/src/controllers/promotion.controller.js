import crypto from "crypto";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import razorpay from "../config/razorpay.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import PromotionRequest from "../models/PromotionRequest.js";
import AdSettings from "../models/AdSettings.js";
import { createNotification } from "./notification.controller.js";

const DEFAULT_AD_SETTINGS = {
  key: "global",
  marketplaceHeroMaxAds: 3,
  autoRotate: true,
  defaultDurationDays: 7,
  minimumPrice: 2,
  maximumActiveAdsPerSeller: 2,
};

const PROMOTION_POPULATE = [
  { path: "sellerId", select: "name email profilePictureUrl" },
  {
    path: "productId",
    select: "title thumbnailUrl price category status changeRequest isDeleted",
  },
  { path: "approvedBy", select: "name email" },
];

let expiryJobStarted = false;

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const formatPlacementLabel = (placement) => {
  if (placement === "MARKETPLACE_HERO") return "Marketplace Hero";
  return placement;
};

const getAdSettings = async () => {
  const settings = await AdSettings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: DEFAULT_AD_SETTINGS },
    { new: true, upsert: true }
  );

  // Roll older seeded defaults forward without overriding future custom values.
  if (settings.minimumPrice === 299 || settings.minimumPrice === 1) {
    settings.minimumPrice = 2;
    await settings.save();
  }

  return settings;
};

const addDays = (startDate, days) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(days));
  return endDate;
};

const promotionAmountToPaise = (promotion) =>
  Math.round(Number(promotion.amount || 0) * 100);

const normalizeTargetLink = (value, productId) => {
  const fallback = `/marketplace/${productId}`;

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
};

const uploadBuffer = async ({
  buffer,
  folder,
  resourceType = "image",
  transformation,
}) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        transformation,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    upload.end(buffer);
  });

const parsePositiveNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return parsed;
};

const parseOptionalPositiveNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveNumber(value, fieldName);
};

const applyPromotionPopulate = (query) => {
  let populatedQuery = query;
  for (const path of PROMOTION_POPULATE) {
    populatedQuery = populatedQuery.populate(path);
  }
  return populatedQuery;
};

const getPromotionBySeller = (promotionId, sellerId) =>
  PromotionRequest.findOne({
    _id: promotionId,
    sellerId,
  });

const getPaymentReceipt = (promotionId) => {
  const compactId = String(promotionId).replace(/[^a-zA-Z0-9]/g, "").slice(-18);
  return `promo_${compactId}`;
};

const getApprovedOwnedProduct = async (productId, sellerId) =>
  Product.findOne({
    _id: productId,
    sellerId,
    status: "approved",
    changeRequest: "none",
    isDeleted: { $ne: true },
  });

const isProductEligibleForPromotion = (product) =>
  Boolean(
    product &&
      product.status === "approved" &&
      product.changeRequest === "none" &&
      product.isDeleted !== true
  );

const notifyAdmins = async (title, message, promotionId) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin._id,
        "promotion_event",
        title,
        message,
        promotionId,
        "PromotionRequest",
        {
          category: "promotion",
          priority: "high",
          actionUrl: "/dashboard/admin/promotions",
          actionLabel: "Open promotions",
          audienceRole: "admin",
        }
      )
    )
  );
};

const notifySeller = async (sellerId, title, message, promotionId, actionUrl) =>
  createNotification(
    sellerId,
    "promotion_event",
    title,
    message,
    promotionId,
    "PromotionRequest",
    {
      category: "promotion",
      priority: "high",
      actionUrl,
      actionLabel: "View promotion",
      audienceRole: "seller",
    }
  );

const mapPromotionMetrics = (promotion) => {
  const impressions = promotion.impressions || 0;
  const clicks = promotion.clicks || 0;
  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

  return {
    ...promotion,
    metrics: {
      impressions,
      clicks,
      ctr,
      ordersGenerated: promotion.ordersGenerated || 0,
      revenueGenerated: promotion.revenueGenerated || 0,
      history: promotion.history || [],
    },
  };
};

const enforceSellerActiveLimit = async (sellerId, excludePromotionId = null) => {
  const settings = await getAdSettings();
  const now = new Date();

  const filter = {
    sellerId,
    status: "ACTIVE",
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (excludePromotionId) {
    filter._id = { $ne: excludePromotionId };
  }

  const activeCount = await PromotionRequest.countDocuments(filter);

  if (activeCount >= settings.maximumActiveAdsPerSeller) {
    throw new Error(
      `Seller already has the maximum allowed ${settings.maximumActiveAdsPerSeller} active ads`
    );
  }

  return settings;
};

const activatePromotion = async (
  promotion,
  {
    paymentMethod,
    transactionId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paidAt,
    activatedAt,
    paymentSubmittedAt,
    paymentVerifiedAt,
    adminNote,
  } = {}
) => {
  const product = await getApprovedOwnedProduct(promotion.productId, promotion.sellerId);
  if (!product) {
    throw new Error("Product is no longer eligible for promotion");
  }

  const wasAlreadyActive =
    promotion.status === "ACTIVE" && promotion.paymentStatus === "PAID";

  if (!wasAlreadyActive) {
    await enforceSellerActiveLimit(promotion.sellerId, promotion._id);
  }

  const startDate = promotion.startDate || new Date();
  const duration = promotion.approvedDurationDays || promotion.requestedDurationDays || 7;

  promotion.paymentMethod = paymentMethod || promotion.paymentMethod || "RAZORPAY";
  promotion.paymentStatus = "PAID";
  promotion.status = "ACTIVE";
  promotion.transactionId = transactionId || promotion.transactionId || razorpayPaymentId || "";
  promotion.razorpayOrderId = razorpayOrderId || promotion.razorpayOrderId || null;
  promotion.razorpayPaymentId = razorpayPaymentId || promotion.razorpayPaymentId || null;
  promotion.razorpaySignature = razorpaySignature || promotion.razorpaySignature || null;
  promotion.paidAt = paidAt || promotion.paidAt || new Date();
  promotion.activatedAt = activatedAt || promotion.activatedAt || new Date();
  promotion.paymentSubmittedAt =
    paymentSubmittedAt || promotion.paymentSubmittedAt || promotion.paidAt;
  promotion.paymentVerifiedAt =
    paymentVerifiedAt || promotion.paymentVerifiedAt || promotion.activatedAt;
  promotion.startDate = startDate;
  promotion.endDate = addDays(startDate, duration);
  promotion.adminNote = adminNote?.trim() || promotion.adminNote || "";

  await promotion.save();

  if (!wasAlreadyActive) {
    await notifySeller(
      promotion.sellerId,
      "Promotion Activated",
      `Your promotion for "${promotion.productTitle}" is now live in the marketplace hero section.`,
      promotion._id,
      `/dashboard/seller/promotions/${promotion._id}`
    );
  }

  return promotion;
};

const getPopulatedPromotionResponse = async (promotionId) => {
  const populatedPromotion = await applyPromotionPopulate(
    PromotionRequest.findById(promotionId)
  );
  return mapPromotionMetrics(populatedPromotion.toObject());
};

const validatePromotionRazorpayPayment = async ({
  promotion,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (promotion.razorpayOrderId !== razorpayOrderId) {
    throw new Error("Invalid Razorpay order");
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    promotion.paymentMethod = "RAZORPAY";
    promotion.paymentStatus = "FAILED";
    await promotion.save();
    throw new Error("Payment signature verification failed");
  }

  const [payment, order] = await Promise.all([
    razorpay.payments.fetch(razorpayPaymentId),
    razorpay.orders.fetch(razorpayOrderId),
  ]);

  if (payment.order_id !== razorpayOrderId) {
    throw new Error("Razorpay payment does not belong to this order");
  }

  if (order.id !== razorpayOrderId) {
    throw new Error("Razorpay order lookup failed");
  }

  const expectedAmount = promotionAmountToPaise(promotion);
  if (payment.amount !== expectedAmount || order.amount !== expectedAmount) {
    throw new Error("Razorpay payment amount mismatch");
  }

  if (payment.currency !== "INR" || order.currency !== "INR") {
    throw new Error("Unsupported payment currency");
  }

  return { payment, order };
};

export const handlePromotionPaymentCaptured = async (payment) => {
  if (!payment?.order_id) {
    return null;
  }

  const promotion = await PromotionRequest.findOne({
    razorpayOrderId: payment.order_id,
  });

  if (!promotion) {
    return null;
  }

  const metadata = await activatePromotion(promotion, {
    paymentMethod: "RAZORPAY",
    transactionId: payment.id,
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
    paidAt: new Date(),
    activatedAt: new Date(),
    paymentSubmittedAt: new Date(),
    paymentVerifiedAt: new Date(),
  });

  return metadata;
};

export const handlePromotionOrderPaid = async (orderEntity) => {
  if (!orderEntity?.id) {
    return null;
  }

  const promotion =
    (orderEntity.notes?.promotionId &&
      (await PromotionRequest.findById(orderEntity.notes.promotionId))) ||
    (await PromotionRequest.findOne({ razorpayOrderId: orderEntity.id }));

  if (!promotion) {
    return null;
  }

  const payments = await razorpay.orders.fetchPayments(orderEntity.id);
  const paidPayment =
    payments?.items?.find((item) => item.status === "captured") ||
    payments?.items?.find((item) => item.status === "authorized") ||
    null;

  if (!paidPayment) {
    return promotion;
  }

  return activatePromotion(promotion, {
    paymentMethod: "RAZORPAY",
    transactionId: paidPayment.id,
    razorpayOrderId: orderEntity.id,
    razorpayPaymentId: paidPayment.id,
    paidAt: new Date(),
    activatedAt: new Date(),
    paymentSubmittedAt: new Date(),
    paymentVerifiedAt: new Date(),
  });
};

export const handlePromotionPaymentFailed = async (payment, failureReason = "") => {
  if (!payment?.order_id) {
    return null;
  }

  const promotion = await PromotionRequest.findOne({
    razorpayOrderId: payment.order_id,
  });

  if (!promotion) {
    return null;
  }

  promotion.paymentMethod = "RAZORPAY";
  promotion.paymentStatus = "FAILED";
  promotion.status = "APPROVED_WAITING_PAYMENT";
  promotion.transactionId = payment.id || promotion.transactionId || "";
  promotion.razorpayPaymentId = payment.id || promotion.razorpayPaymentId || null;
  await promotion.save();

  await notifySeller(
    promotion.sellerId,
    "Promotion Payment Failed",
    `Your payment for "${promotion.productTitle}" failed${failureReason ? `: ${failureReason}` : "."} You can retry payment from your promotions page.`,
    promotion._id,
    `/dashboard/seller/promotions/${promotion._id}`
  );

  return promotion;
};

export const createPromotionRequest = async (req, res) => {
  try {
    const {
      productId,
      placement = "MARKETPLACE_HERO",
      title,
      subtitle,
      buttonText,
      targetLink,
      promotionGoal,
      requestedDurationDays,
      sellerNote,
      heroBgColor,
    } = req.body;

    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Array.isArray(req.files?.adImages)
        ? req.files.adImages
        : [];
    const bannerCardFile =
      !Array.isArray(req.files) && Array.isArray(req.files?.bannerCard)
        ? req.files.bannerCard[0] || null
        : null;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Valid product is required" });
    }

    if (!title?.trim() || !subtitle?.trim()) {
      return res.status(400).json({ message: "Title and subtitle are required" });
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    if (uploadedFiles.length > 3) {
      return res.status(400).json({ message: "Maximum 3 images allowed" });
    }

    const product = await getApprovedOwnedProduct(productId, req.user.id);
    if (!product) {
      return res.status(404).json({ message: "Approved seller product not found" });
    }

    if (placement !== "MARKETPLACE_HERO") {
      return res.status(400).json({ message: "Unsupported placement" });
    }

    const settings = await getAdSettings();
    const duration = requestedDurationDays
      ? parsePositiveNumber(requestedDurationDays, "Requested duration")
      : settings.defaultDurationDays;

    const bannerImageUpload = bannerCardFile
      ? await uploadBuffer({
          buffer: bannerCardFile.buffer,
          folder: "bitforge/promotions/banner-cards",
          transformation: [{ width: 1600, height: 900, crop: "limit" }],
        })
      : null;

    const adImages = await Promise.all(
      uploadedFiles.map(async (file, index) => {
        const uploadResult = await uploadBuffer({
          buffer: file.buffer,
          folder: "bitforge/promotions/banners",
          transformation: [{ width: 1200, height: 1200, crop: "limit" }],
        });
        return {
          url: uploadResult.secure_url,
          key: uploadResult.public_id,
          position: index,
          type: "transparent"
        };
      })
    );

    const promotion = await PromotionRequest.create({
      sellerId: req.user.id,
      sellerName: req.user.name,
      productId: product._id,
      productTitle: product.title,
      productThumbnailUrl: product.thumbnailUrl || null,
      placement,
      title: title.trim(),
      subtitle: subtitle.trim(),
      bannerImage: bannerImageUpload?.secure_url || null,
      bannerImageKey: bannerImageUpload?.public_id || null,
      adImages,
      buttonText: buttonText?.trim() || "View Product",
      targetLink: normalizeTargetLink(targetLink, product._id),
      promotionGoal: promotionGoal?.trim() || "",
      requestedDurationDays: duration,
      sellerNote: sellerNote?.trim() || "",
      heroBgColor: heroBgColor && /^#[0-9A-Fa-f]{6}$/i.test(heroBgColor) ? heroBgColor : "#2563EB",
      heroTextColor: req.body.heroTextColor || "auto",
      heroLayout: req.body.heroLayout || "floating",
      heroTitleColor: req.body.heroTitleColor || "",
      heroSubtitleColor: req.body.heroSubtitleColor || "",
      heroButtonBgColor: req.body.heroButtonBgColor || "",
      heroButtonTextColor: req.body.heroButtonTextColor || "",
      heroFontFamily: req.body.heroFontFamily || "inherit",
    });

    await notifyAdmins(
      "New Promotion Request",
      `${req.user.name} submitted a ${formatPlacementLabel(placement)} promotion request for "${product.title}".`,
      promotion._id
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.status(201).json({
      message: "Promotion request submitted successfully",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Create promotion request error:", error);
    return res.status(500).json({ message: error.message || "Failed to create promotion request" });
  }
};

export const getSellerPromotions = async (req, res) => {
  try {
    const filter = { sellerId: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const promotions = await applyPromotionPopulate(
      PromotionRequest.find(filter).sort({ createdAt: -1 })
    );

    return res.json({
      promotions: promotions.map((promotion) => mapPromotionMetrics(promotion.toObject())),
    });
  } catch (error) {
    console.error("Get seller promotions error:", error);
    return res.status(500).json({ message: "Failed to fetch promotions" });
  }
};

export const getSellerPromotionById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await applyPromotionPopulate(
      PromotionRequest.findOne({ _id: req.params.id, sellerId: req.user.id })
    );

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.json({ promotion: mapPromotionMetrics(promotion.toObject()) });
  } catch (error) {
    console.error("Get seller promotion detail error:", error);
    return res.status(500).json({ message: "Failed to fetch promotion" });
  }
};

export const cancelSellerPromotion = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findOne({
      _id: req.params.id,
      sellerId: req.user.id,
    });

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (["ACTIVE", "EXPIRED", "CANCELLED"].includes(promotion.status)) {
      return res.status(400).json({ message: "This promotion cannot be cancelled anymore" });
    }

    promotion.status = "CANCELLED";

    if (promotion.bannerImageKey) {
      cloudinary.uploader.destroy(promotion.bannerImageKey).catch(console.error);
      promotion.bannerImageKey = null;
      promotion.bannerImage = null;
    }
    if (promotion.adImages && promotion.adImages.length > 0) {
      promotion.adImages.forEach(img => {
        if (img.key) cloudinary.uploader.destroy(img.key).catch(console.error);
      });
      promotion.adImages = [];
    }

    await promotion.save();

    await notifyAdmins(
      "Promotion Cancelled",
      `${req.user.name} cancelled the promotion request for "${promotion.productTitle}".`,
      promotion._id
    );

    return res.json({
      message: "Promotion request cancelled",
      promotion: mapPromotionMetrics(promotion.toObject()),
    });
  } catch (error) {
    console.error("Cancel seller promotion error:", error);
    return res.status(500).json({ message: "Failed to cancel promotion" });
  }
};

export const uploadPromotionPaymentProof = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findOne({
      _id: req.params.id,
      sellerId: req.user.id,
    });

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (!["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status)) {
      return res.status(400).json({ message: "Payment proof cannot be uploaded for this promotion" });
    }

    const transactionId = req.body.transactionId?.trim() || "";
    if (!req.file && !transactionId) {
      return res.status(400).json({ message: "Upload a payment proof image or add a transaction id" });
    }

    if (req.file) {
      const uploadResult = await uploadBuffer({
        buffer: req.file.buffer,
        folder: "bitforge/promotions/payment-proofs",
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      });

      promotion.paymentProofImage = uploadResult.secure_url;
      promotion.paymentProofImageKey = uploadResult.public_id;
    }

    promotion.transactionId = transactionId || promotion.transactionId;
    promotion.paymentMethod = req.body.paymentMethod || "MANUAL";
    promotion.paymentStatus = "PENDING";
    promotion.status = "PAYMENT_PENDING";
    promotion.paymentSubmittedAt = new Date();

    await promotion.save();

    await notifyAdmins(
      "Promotion Payment Submitted",
      `${req.user.name} submitted payment proof for "${promotion.productTitle}".`,
      promotion._id
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Payment proof uploaded successfully",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    return res.status(500).json({ message: "Failed to upload payment proof" });
  }
};

export const getAllPromotionsAdmin = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.placement) {
      filter.placement = req.query.placement;
    }

    const [promotions, activeNow, needsReview, expiringSoon, revenueResult] = await Promise.all([
      applyPromotionPopulate(PromotionRequest.find(filter).sort({ createdAt: -1 })),
      PromotionRequest.countDocuments({ status: "ACTIVE" }),
      PromotionRequest.countDocuments({ status: { $in: ["PENDING_REVIEW", "APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"] } }),
      PromotionRequest.countDocuments({
        status: "ACTIVE",
        endDate: { 
          $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        }
      }),
      PromotionRequest.aggregate([
        { $match: { paymentStatus: "PAID", status: { $ne: "REJECTED" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const revenuePipeline = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return res.json({
      promotions: promotions.map((promotion) => mapPromotionMetrics(promotion.toObject())),
      stats: {
        total: promotions.length,
        activeNow,
        needsReview,
        expiringSoon,
        revenuePipeline
      }
    });
  } catch (error) {
    console.error("Get all promotions admin error:", error);
    return res.status(500).json({ message: "Failed to fetch promotions" });
  }
};

export const getPromotionAdminById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await applyPromotionPopulate(PromotionRequest.findById(req.params.id));

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.json({ promotion: mapPromotionMetrics(promotion.toObject()) });
  } catch (error) {
    console.error("Get admin promotion detail error:", error);
    return res.status(500).json({ message: "Failed to fetch promotion" });
  }
};

export const approvePromotionAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (!["PENDING_REVIEW", "REJECTED"].includes(promotion.status)) {
      return res.status(400).json({ message: "Only pending or rejected promotions can be approved" });
    }

    const settings = await getAdSettings();
    const amount = parsePositiveNumber(req.body.amount, "Amount");
    const approvedDurationDays =
      parseOptionalPositiveNumber(req.body.approvedDurationDays, "Approved duration") ||
      settings.defaultDurationDays;
    const priority = parseOptionalPositiveNumber(req.body.priority, "Priority") || promotion.priority;
    const placement = req.body.placement || promotion.placement;
    const maxImpressions = parseOptionalPositiveNumber(req.body.maxImpressions, "Max impressions");

    if (amount < settings.minimumPrice) {
      return res
        .status(400)
        .json({ message: `Amount must be at least INR ${settings.minimumPrice}` });
    }

    if (placement !== "MARKETPLACE_HERO") {
      return res.status(400).json({ message: "Unsupported placement" });
    }

    promotion.amount = amount;
    promotion.currency = "INR";
    promotion.placement = placement;
    promotion.approvedDurationDays = approvedDurationDays;
    promotion.priority = priority;
    promotion.maxImpressions = maxImpressions;
    promotion.adminNote = req.body.adminNote?.trim() || "";
    promotion.heroBgColor = req.body.heroBgColor || promotion.heroBgColor;
    promotion.heroTextColor = req.body.heroTextColor || promotion.heroTextColor;
    promotion.heroLayout = req.body.heroLayout || promotion.heroLayout;
    if (req.body.heroTitleColor !== undefined) promotion.heroTitleColor = req.body.heroTitleColor;
    if (req.body.heroSubtitleColor !== undefined) promotion.heroSubtitleColor = req.body.heroSubtitleColor;
    if (req.body.heroButtonBgColor !== undefined) promotion.heroButtonBgColor = req.body.heroButtonBgColor;
    if (req.body.heroButtonTextColor !== undefined) promotion.heroButtonTextColor = req.body.heroButtonTextColor;
    if (req.body.heroFontFamily !== undefined) promotion.heroFontFamily = req.body.heroFontFamily;
    promotion.rejectedReason = "";
    promotion.status = "APPROVED_WAITING_PAYMENT";
    promotion.paymentMethod = req.body.paymentMethod === "MANUAL" ? "MANUAL" : "RAZORPAY";
    promotion.paymentStatus = "PENDING";
    promotion.paymentProofImage = null;
    promotion.paymentProofImageKey = null;
    promotion.transactionId = "";
    promotion.razorpayOrderId = null;
    promotion.razorpayPaymentId = null;
    promotion.razorpaySignature = null;
    promotion.paidAt = null;
    promotion.activatedAt = null;
    promotion.paymentSubmittedAt = null;
    promotion.paymentVerifiedAt = null;
    promotion.approvedBy = req.user.id;
    promotion.approvedAt = new Date();

    await promotion.save();

    await notifySeller(
      promotion.sellerId,
      "Promotion Approved",
      `Your promotion for "${promotion.productTitle}" was approved. Please pay INR ${amount} to activate it.`,
      promotion._id,
      `/dashboard/seller/promotions/${promotion._id}`
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion approved and waiting for payment",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Approve promotion error:", error);
    return res.status(500).json({ message: error.message || "Failed to approve promotion" });
  }
};

export const rejectPromotionAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (["ACTIVE", "EXPIRED", "CANCELLED"].includes(promotion.status)) {
      return res.status(400).json({ message: "This promotion cannot be rejected" });
    }

    const rejectedReason = req.body.rejectedReason?.trim() || req.body.reason?.trim();
    if (!rejectedReason) {
      return res.status(400).json({ message: "Rejected reason is required" });
    }

    promotion.status = "REJECTED";
    promotion.rejectedReason = rejectedReason;
    promotion.adminNote = req.body.adminNote?.trim() || promotion.adminNote || "";

    if (promotion.bannerImageKey) {
      cloudinary.uploader.destroy(promotion.bannerImageKey).catch(console.error);
      promotion.bannerImageKey = null;
      promotion.bannerImage = null;
    }
    if (promotion.adImages && promotion.adImages.length > 0) {
      promotion.adImages.forEach(img => {
        if (img.key) cloudinary.uploader.destroy(img.key).catch(console.error);
      });
      promotion.adImages = [];
    }

    await promotion.save();

    await notifySeller(
      promotion.sellerId,
      "Promotion Rejected",
      `Your promotion for "${promotion.productTitle}" was rejected. Reason: ${rejectedReason}`,
      promotion._id,
      `/dashboard/seller/promotions/${promotion._id}`
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion rejected",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Reject promotion error:", error);
    return res.status(500).json({ message: "Failed to reject promotion" });
  }
};

export const verifyPromotionPaymentAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (!["APPROVED_WAITING_PAYMENT", "PAYMENT_PENDING"].includes(promotion.status)) {
      return res.status(400).json({ message: "This promotion is not waiting for payment verification" });
    }
    await activatePromotion(promotion, {
      paymentMethod: req.body.paymentMethod || "MANUAL",
      transactionId: req.body.transactionId?.trim() || promotion.transactionId,
      paymentSubmittedAt: promotion.paymentSubmittedAt || new Date(),
      paymentVerifiedAt: new Date(),
      paidAt: new Date(),
      activatedAt: new Date(),
      adminNote: req.body.adminNote,
    });

    return res.json({
      message: "Payment verified and promotion activated",
      promotion: await getPopulatedPromotionResponse(promotion._id),
    });
  } catch (error) {
    console.error("Verify promotion payment error:", error);
    return res.status(500).json({ message: error.message || "Failed to verify payment" });
  }
};

export const createPromotionPaymentOrder = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await getPromotionBySeller(req.params.id, req.user.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion request not found" });
    }

    if (promotion.status !== "APPROVED_WAITING_PAYMENT") {
      return res.status(400).json({ message: "Promotion is not ready for payment" });
    }

    if (promotion.paymentStatus === "PAID" || promotion.status === "ACTIVE") {
      return res.status(400).json({ message: "Promotion payment is already completed" });
    }

    if (!promotion.amount || promotion.amount <= 0) {
      return res.status(400).json({ message: "Promotion amount is not set" });
    }

    const product = await getApprovedOwnedProduct(promotion.productId, promotion.sellerId);
    if (!product) {
      return res.status(400).json({ message: "Product is no longer eligible for promotion" });
    }

    const amount = promotionAmountToPaise(promotion);
    const receipt = getPaymentReceipt(promotion._id);
    let order = null;

    if (promotion.razorpayOrderId) {
      try {
        const existingOrder = await razorpay.orders.fetch(promotion.razorpayOrderId);
        if (
          existingOrder &&
          existingOrder.status === "created" &&
          existingOrder.amount === amount &&
          existingOrder.currency === "INR"
        ) {
          order = existingOrder;
        }
      } catch (error) {
        console.warn("Unable to reuse existing promotion Razorpay order:", error.message);
      }
    }

    if (!order) {
      order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt,
        notes: {
          promotionId: String(promotion._id),
          sellerId: String(promotion.sellerId),
          productId: String(promotion.productId),
          type: "PROMOTION_PAYMENT",
        },
      });
    }

    promotion.razorpayOrderId = order.id;
    promotion.paymentMethod = "RAZORPAY";
    promotion.paymentStatus = "PENDING";
    promotion.status = "APPROVED_WAITING_PAYMENT";
    await promotion.save();

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      promotionId: promotion._id,
    });
  } catch (error) {
    console.error("Create promotion payment order error:", error);
    return res.status(500).json({ message: error.message || "Failed to create payment order" });
  }
};

export const verifyPromotionPayment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    const promotion = await getPromotionBySeller(req.params.id, req.user.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion request not found" });
    }

    if (promotion.status === "ACTIVE" && promotion.paymentStatus === "PAID") {
      return res.json({
        success: true,
        message: "Promotion is already active",
        promotion: await getPopulatedPromotionResponse(promotion._id),
      });
    }

    if (promotion.status !== "APPROVED_WAITING_PAYMENT") {
      return res.status(400).json({ message: "Promotion is not ready for payment verification" });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing Razorpay payment verification details" });
    }

    const { payment, order } = await validatePromotionRazorpayPayment({
      promotion,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const isSettled =
      order.status === "paid" ||
      payment.status === "captured" ||
      payment.captured === true;

    if (!isSettled) {
      promotion.paymentMethod = "RAZORPAY";
      promotion.paymentStatus = "PENDING";
      await promotion.save();

      return res.status(202).json({
        success: true,
        message: "Payment received and awaiting final capture. Promotion will activate automatically via webhook.",
        promotion: await getPopulatedPromotionResponse(promotion._id),
      });
    }

    await activatePromotion(promotion, {
      paymentMethod: "RAZORPAY",
      transactionId: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date(),
      activatedAt: new Date(),
      paymentSubmittedAt: new Date(),
      paymentVerifiedAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Promotion payment verified and ad activated",
      promotion: await getPopulatedPromotionResponse(promotion._id),
    });
  } catch (error) {
    console.error("Verify promotion payment error:", error);
    const clientSafeErrors = [
      "Invalid Razorpay order",
      "Payment signature verification failed",
      "Razorpay payment does not belong to this order",
      "Razorpay order lookup failed",
      "Razorpay payment amount mismatch",
      "Unsupported payment currency",
      "Product is no longer eligible for promotion",
    ];
    const statusCode = clientSafeErrors.includes(error.message) ? 400 : 500;
    return res.status(statusCode).json({ message: error.message || "Failed to verify promotion payment" });
  }
};

export const pausePromotionAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (promotion.status !== "ACTIVE") {
      return res.status(400).json({ message: "Only active promotions can be paused" });
    }

    promotion.status = "PAUSED";
    promotion.adminNote = req.body.adminNote?.trim() || promotion.adminNote || "";
    await promotion.save();

    await notifySeller(
      promotion.sellerId,
      "Promotion Paused",
      `Your promotion for "${promotion.productTitle}" has been paused by the admin team.`,
      promotion._id,
      `/dashboard/seller/promotions/${promotion._id}`
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion paused successfully",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Pause promotion error:", error);
    return res.status(500).json({ message: "Failed to pause promotion" });
  }
};

export const resumePromotionAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (promotion.status !== "PAUSED") {
      return res.status(400).json({ message: "Only paused promotions can be resumed" });
    }

    if (promotion.endDate && promotion.endDate < new Date()) {
      promotion.status = "EXPIRED";
      await promotion.save();
      return res.status(400).json({ message: "Promotion has already expired and cannot be resumed" });
    }

    const product = await getApprovedOwnedProduct(promotion.productId, promotion.sellerId);
    if (!product) {
      return res.status(400).json({ message: "Product is no longer eligible for promotion" });
    }

    await enforceSellerActiveLimit(promotion.sellerId, promotion._id);

    promotion.status = "ACTIVE";
    promotion.adminNote = req.body.adminNote?.trim() || promotion.adminNote || "";
    await promotion.save();

    await notifySeller(
      promotion.sellerId,
      "Promotion Resumed",
      `Your promotion for "${promotion.productTitle}" is live again.`,
      promotion._id,
      `/dashboard/seller/promotions/${promotion._id}`
    );

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion resumed successfully",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Resume promotion error:", error);
    return res.status(500).json({ message: error.message || "Failed to resume promotion" });
  }
};

export const updatePromotionPriorityAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const priority = parsePositiveNumber(req.body.priority, "Priority");
    promotion.priority = priority;
    await promotion.save();

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion priority updated",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Update promotion priority error:", error);
    return res.status(500).json({ message: error.message || "Failed to update priority" });
  }
};

export const getAdSettingsAdmin = async (req, res) => {
  try {
    const settings = await getAdSettings();
    return res.json({ settings });
  } catch (error) {
    console.error("Get ad settings error:", error);
    return res.status(500).json({ message: "Failed to fetch ad settings" });
  }
};

export const updateAdSettingsAdmin = async (req, res) => {
  try {
    const updateData = {
      marketplaceHeroMaxAds: parsePositiveNumber(
        req.body.marketplaceHeroMaxAds,
        "Marketplace hero max ads"
      ),
      defaultDurationDays: parsePositiveNumber(
        req.body.defaultDurationDays,
        "Default duration"
      ),
      minimumPrice: Number(req.body.minimumPrice),
      maximumActiveAdsPerSeller: parsePositiveNumber(
        req.body.maximumActiveAdsPerSeller,
        "Maximum active ads per seller"
      ),
      autoRotate: req.body.autoRotate !== false && req.body.autoRotate !== "false",
    };

    if (!Number.isFinite(updateData.minimumPrice) || updateData.minimumPrice < 0) {
      return res.status(400).json({ message: "Minimum price must be 0 or more" });
    }

    const settings = await AdSettings.findOneAndUpdate(
      { key: "global" },
      { $set: updateData, $setOnInsert: DEFAULT_AD_SETTINGS },
      { new: true, upsert: true }
    );

    return res.json({ message: "Ad settings updated", settings });
  } catch (error) {
    console.error("Update ad settings error:", error);
    return res.status(500).json({ message: error.message || "Failed to update ad settings" });
  }
};

export const getActivePromotions = async (req, res) => {
  try {
    const placement = req.query.placement || "MARKETPLACE_HERO";
    if (placement !== "MARKETPLACE_HERO") {
      return res.status(400).json({ message: "Unsupported placement" });
    }

    const settings = await getAdSettings();
    const now = new Date();

    const candidatePromotions = await PromotionRequest.find({
      placement,
      status: "ACTIVE",
      paymentStatus: "PAID",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ priority: 1, createdAt: -1 })
      .limit(settings.marketplaceHeroMaxAds * 5)
      .populate({ path: "productId", select: "title thumbnailUrl status changeRequest isDeleted price discount" });

    const promotions = candidatePromotions
      .filter((promotion) => {
        const withinImpressionLimit =
          !promotion.maxImpressions || promotion.impressions < promotion.maxImpressions;
        const product = promotion.productId;
        return withinImpressionLimit && isProductEligibleForPromotion(product);
      })
      .slice(0, settings.marketplaceHeroMaxAds);

    const payload = promotions.map((promotion) => ({
      id: promotion._id,
      title: promotion.title,
      subtitle: promotion.subtitle,
      bannerImage: promotion.bannerImage,
      productId: promotion.productId?._id || promotion.productId,
      productTitle: promotion.productTitle,
      productPrice: promotion.productId?.price,
      productDiscount: promotion.productId?.discount,
      promotionGoal: promotion.promotionGoal,
      buttonText: promotion.buttonText || "View Product",
      priority: promotion.priority,
      targetLink: normalizeTargetLink(
        promotion.targetLink,
        promotion.productId?._id || promotion.productId
      ),
      sellerName: promotion.sellerName,
      placement: promotion.placement,
      heroBgColor: promotion.heroBgColor,
      heroTextColor: promotion.heroTextColor,
      heroTitleColor: promotion.heroTitleColor,
      heroSubtitleColor: promotion.heroSubtitleColor,
      heroButtonBgColor: promotion.heroButtonBgColor,
      heroButtonTextColor: promotion.heroButtonTextColor,
      heroFontFamily: promotion.heroFontFamily,
      heroLayout: promotion.heroLayout,
      adImages: promotion.adImages,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

    return res.json({
      promotions: payload,
      settings: {
        marketplaceHeroMaxAds: settings.marketplaceHeroMaxAds,
        autoRotate: settings.autoRotate,
      },
    });
  } catch (error) {
    console.error("Get active promotions error:", error);
    return res.status(500).json({ message: "Failed to fetch active promotions" });
  }
};

export const updatePromotionStyleAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const promotion = await PromotionRequest.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const { 
      heroBgColor, heroTextColor, heroLayout, 
      heroTitleColor, heroSubtitleColor, 
      heroButtonBgColor, heroButtonTextColor, 
      heroFontFamily 
    } = req.body;

    if (heroBgColor !== undefined) {
      if (heroBgColor && !/^#[0-9A-Fa-f]{6}$/i.test(heroBgColor)) {
        return res.status(400).json({ message: "Invalid hex color format" });
      }
      promotion.heroBgColor = heroBgColor;
    }

    if (heroTextColor !== undefined) promotion.heroTextColor = heroTextColor;
    if (heroLayout !== undefined) promotion.heroLayout = heroLayout;
    if (heroTitleColor !== undefined) promotion.heroTitleColor = heroTitleColor;
    if (heroSubtitleColor !== undefined) promotion.heroSubtitleColor = heroSubtitleColor;
    if (heroButtonBgColor !== undefined) promotion.heroButtonBgColor = heroButtonBgColor;
    if (heroButtonTextColor !== undefined) promotion.heroButtonTextColor = heroButtonTextColor;
    if (heroFontFamily !== undefined) promotion.heroFontFamily = heroFontFamily;

    await promotion.save();

    const populatedPromotion = await applyPromotionPopulate(
      PromotionRequest.findById(promotion._id)
    );

    return res.json({
      message: "Promotion style updated successfully",
      promotion: mapPromotionMetrics(populatedPromotion.toObject()),
    });
  } catch (error) {
    console.error("Update promotion style error:", error);
    return res.status(500).json({ message: "Failed to update promotion style" });
  }
};

export const recordPromotionImpression = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const now = new Date();
    await PromotionRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "ACTIVE",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      { $inc: { impressions: 1 } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Record promotion impression error:", error);
    return res.status(500).json({ message: "Failed to record impression" });
  }
};

export const recordPromotionClick = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id" });
    }

    const now = new Date();
    await PromotionRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "ACTIVE",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      { $inc: { clicks: 1 } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Record promotion click error:", error);
    return res.status(500).json({ message: "Failed to record click" });
  }
};

export const expirePromotionsJob = async () => {
  const now = new Date();
  const expiringPromotions = await PromotionRequest.find({
    status: { $in: ["ACTIVE", "PAUSED"] },
    endDate: { $lt: now },
  }).select("_id sellerId productTitle");

  if (expiringPromotions.length === 0) {
    return;
  }

  await PromotionRequest.updateMany(
    {
      _id: { $in: expiringPromotions.map((promotion) => promotion._id) },
    },
    {
      $set: {
        status: "EXPIRED",
      },
    }
  );

  await Promise.all(
    expiringPromotions.map((promotion) =>
      notifySeller(
        promotion.sellerId,
        "Promotion Expired",
        `Your promotion for "${promotion.productTitle}" has expired automatically.`,
        promotion._id,
        `/dashboard/seller/promotions/${promotion._id}`
      )
    )
  );
};

export const startPromotionExpiryJob = () => {
  if (expiryJobStarted) {
    return;
  }

  expiryJobStarted = true;
  expirePromotionsJob().catch((error) => {
    console.error("Initial promotion expiry job error:", error);
  });

  setInterval(() => {
    expirePromotionsJob().catch((error) => {
      console.error("Promotion expiry job error:", error);
    });
  }, 60 * 60 * 1000);
};
