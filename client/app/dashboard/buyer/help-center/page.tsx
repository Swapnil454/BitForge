"use client";

import { useRouter } from "next/navigation";
import SupportChat from "@/app/dashboard/components/help/SupportChat";

export default function BuyerHelpCenterPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10"
          >
            ← Back
          </button>
          <p className="text-[11px] text-white/50">Buyer · Help Center</p>
        </div>

        <SupportChat
          title="Buyer Help Center"
          subtitle="Ask questions about your purchases, downloads, refunds and more."
        />
      </div>
    </main>
  );
}
