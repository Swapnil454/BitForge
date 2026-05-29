import { TransactionStatus } from "./types";

export function getStatusConfig(status: TransactionStatus) {
  switch (status) {
    case "paid":
      return {
        title: "Payment Successful",
        shortLabel: "Paid",
        panelClass:
          "bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
        orbColor: "bg-emerald-200 dark:bg-emerald-700",
        iconBg: "bg-emerald-200 dark:bg-emerald-800",
        iconColor: "text-emerald-700 dark:text-emerald-300",
        titleColor: "text-emerald-950 dark:text-emerald-50",
        messageColor: "text-emerald-800 dark:text-emerald-300",
        amountColor: "text-emerald-950 dark:text-emerald-50",
        amountLabelColor: "text-emerald-700 dark:text-emerald-400",
        badgeClass:
          "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-800 dark:text-emerald-200 dark:border-emerald-700",
        chipClass:
          "bg-white border-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300",
        message: "Payment verified. Your product is now ready to download.",
      };
    case "failed":
      return {
        title: "Payment Failed",
        shortLabel: "Failed",
        panelClass:
          "bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
        orbColor: "bg-rose-200 dark:bg-rose-700",
        iconBg: "bg-rose-200 dark:bg-rose-800",
        iconColor: "text-rose-700 dark:text-rose-300",
        titleColor: "text-rose-950 dark:text-rose-50",
        messageColor: "text-rose-800 dark:text-rose-300",
        amountColor: "text-rose-950 dark:text-rose-50",
        amountLabelColor: "text-rose-700 dark:text-rose-400",
        badgeClass:
          "bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-800 dark:text-rose-200 dark:border-rose-700",
        chipClass:
          "bg-white border-rose-200 text-rose-800 dark:bg-rose-900 dark:border-rose-700 dark:text-rose-300",
        message: "Payment could not be completed. Retry from product page to continue.",
      };
    default:
      return {
        title: "Payment Pending",
        shortLabel: "Pending",
        panelClass:
          "bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
        orbColor: "bg-amber-200 dark:bg-amber-700",
        iconBg: "bg-amber-200 dark:bg-amber-800",
        iconColor: "text-amber-700 dark:text-amber-300",
        titleColor: "text-amber-950 dark:text-amber-50",
        messageColor: "text-amber-800 dark:text-amber-300",
        amountColor: "text-amber-950 dark:text-amber-50",
        amountLabelColor: "text-amber-700 dark:text-amber-400",
        badgeClass:
          "bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:border-amber-700",
        chipClass:
          "bg-white border-amber-200 text-amber-800 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-300",
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
