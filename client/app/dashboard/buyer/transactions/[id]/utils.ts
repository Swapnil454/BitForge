import { TransactionStatus } from "./types";

export function getStatusConfig(status: TransactionStatus) {
  switch (status) {
    case "paid":
      return {
        title: "Payment Successful",
        shortLabel: "Success",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        panelClass: "from-emerald-500/20 via-green-500/15 to-teal-500/10 border-emerald-500/35",
        message: "Payment verified. Your product is now ready to download.",
      };
    case "failed":
      return {
        title: "Payment Failed",
        shortLabel: "Failed",
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
        panelClass: "from-rose-500/20 via-red-500/15 to-orange-500/10 border-rose-500/35",
        message: "Payment could not be completed. Retry from product page to continue.",
      };
    default:
      return {
        title: "Payment Pending",
        shortLabel: "Pending",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        panelClass: "from-amber-500/20 via-yellow-500/15 to-orange-500/10 border-amber-500/35",
        message: "Payment is in progress. It will update automatically once confirmed.",
      };
  }
}

export function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
