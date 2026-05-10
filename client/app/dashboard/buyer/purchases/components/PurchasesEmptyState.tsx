"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PurchasesEmptyState() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-12 text-center shadow-lg">
      <div className="mx-auto mb-4 h-14 w-14 rounded-xl border border-slate-200 dark:border-white/10 bg-white/[0.04] inline-flex items-center justify-center">
        <ShoppingBag className="h-7 w-7 text-cyan-300" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No purchases yet</h2>
      <p className="text-slate-500 dark:text-white/60 mb-6 max-w-md mx-auto">
        Your order history is empty. Start exploring the marketplace to find high-quality digital products and make your first purchase.
      </p>
      <button
        type="button"
        onClick={() => router.push("/marketplace")}
        className="h-10 rounded-lg px-6 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all duration-200"
      >
        Browse Marketplace
      </button>
    </div>
  );
}
