"use client";

import AdminTicketCenter from "@/app/dashboard/components/help/AdminTicketCenter";

export default function AdminHelpCenterPage() {
  return (
    <main className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto h-[100dvh] w-full bg-slate-50 dark:bg-[#0B141A] overflow-hidden flex flex-col">
      <AdminTicketCenter />
    </main>
  );
}
