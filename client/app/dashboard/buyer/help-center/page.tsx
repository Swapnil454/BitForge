"use client";

import SupportChat from "@/app/dashboard/components/help/SupportChat";

export default function BuyerHelpCenterPage() {
  return (
    <main className="h-[100dvh] w-full bg-white dark:bg-black overflow-hidden flex flex-col">
      <SupportChat
        title="Buyer Help Center"
        subtitle="Ask questions about your purchases, downloads, refunds and more."
      />
    </main>
  );
}
