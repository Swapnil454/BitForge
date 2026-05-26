"use client";

import SupportChat from "@/app/dashboard/components/help/SupportChat";

export default function SellerHelpCenterPage() {
  return (
    <main className="h-[100dvh] w-full bg-white dark:bg-black overflow-hidden flex flex-col">
      <SupportChat
        title="Seller Help Center"
        subtitle="Chat with the admin team for payouts, products, disputes and more."
      />
    </main>
  );
}
