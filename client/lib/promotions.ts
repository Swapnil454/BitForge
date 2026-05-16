export type PromotionStatus =
  | "PENDING_REVIEW"
  | "APPROVED_WAITING_PAYMENT"
  | "REJECTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_VERIFIED"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED"
  | "CANCELLED";

export type PromotionPaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED";
export type PromotionPlacement = "MARKETPLACE_HERO";
export type PromotionPaymentMethod = "MANUAL" | "RAZORPAY";

export interface PromotionUserSummary {
  _id?: string;
  name: string;
  email?: string;
  profilePictureUrl?: string | null;
}

export interface PromotionProductSummary {
  _id?: string;
  title?: string;
  thumbnailUrl?: string | null;
  price?: number;
  category?: string;
  status?: string;
  changeRequest?: string;
  isDeleted?: boolean;
}

export interface PromotionMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  ordersGenerated: number;
  revenueGenerated: number;
}

export interface PromotionRecord {
  _id: string;
  sellerId?: string | PromotionUserSummary;
  productId?: string | PromotionProductSummary;
  productTitle: string;
  productThumbnailUrl?: string | null;
  sellerName: string;
  placement: PromotionPlacement;
  title: string;
  subtitle: string;
  bannerImage?: string | null;
  adImages?: {
    url: string;
    key: string;
    position: number;
    type: "product" | "transparent" | "logo";
  }[];
  heroBgColor?: string;
  heroTextColor?: "light" | "dark" | "auto";
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  heroButtonBgColor?: string;
  heroButtonTextColor?: string;
  heroFontFamily?: string;
  heroLayout?: "floating" | "single" | "minimal" | "legacy";
  buttonText: string;
  targetLink?: string | null;
  promotionGoal?: string;
  requestedDurationDays: number;
  approvedDurationDays?: number | null;
  amount?: number | null;
  currency?: string;
  status: PromotionStatus;
  adminNote?: string;
  sellerNote?: string;
  paymentStatus: PromotionPaymentStatus;
  paymentMethod?: PromotionPaymentMethod;
  paymentProofImage?: string | null;
  transactionId?: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  paidAt?: string | null;
  activatedAt?: string | null;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
  approvedBy?: string | PromotionUserSummary | null;
  approvedAt?: string | null;
  rejectedReason?: string;
  paymentSubmittedAt?: string | null;
  paymentVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metrics: PromotionMetrics;
}

export interface PromotionSettings {
  key?: string;
  marketplaceHeroMaxAds: number;
  autoRotate: boolean;
  defaultDurationDays: number;
  minimumPrice: number;
  maximumActiveAdsPerSeller: number;
}

export interface ActivePromotionBanner {
  id: string;
  title: string;
  subtitle: string;
  bannerImage?: string | null;
  adImages?: {
    url: string;
    key: string;
    position: number;
    type: "product" | "transparent" | "logo";
  }[];
  heroBgColor?: string;
  heroTextColor?: "light" | "dark" | "auto";
  heroLayout?: "floating" | "single" | "minimal" | "legacy";
  heroTitleColor?: string;
  heroSubtitleColor?: string;
  heroButtonBgColor?: string;
  heroButtonTextColor?: string;
  heroFontFamily?: string;
  productId: string;
  productTitle: string;
  productPrice?: number;
  buttonText: string;
  priority: number;
  targetLink: string;
  sellerName: string;
  placement: PromotionPlacement;
}

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED_WAITING_PAYMENT: "Approved / Awaiting Payment",
  REJECTED: "Rejected",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_VERIFIED: "Payment Verified",
  ACTIVE: "Active",
  PAUSED: "Paused",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PromotionPaymentStatus, string> = {
  NOT_REQUIRED: "Not Required",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
};

export const PAYMENT_METHOD_LABELS: Record<PromotionPaymentMethod, string> = {
  MANUAL: "Manual",
  RAZORPAY: "Razorpay",
};

export const PLACEMENT_LABELS: Record<PromotionPlacement, string> = {
  MARKETPLACE_HERO: "Marketplace Hero Banner",
};

export const formatPromotionCurrency = (value?: number | null, currency = "INR") => {
  if (typeof value !== "number") {
    return "TBD";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPromotionDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getPromotionStatusClasses = (status: PromotionStatus) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "APPROVED_WAITING_PAYMENT":
    case "PAYMENT_PENDING":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "PAUSED":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "EXPIRED":
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    default:
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
  }
};

export const getPromotionErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }

  return fallback;
};
