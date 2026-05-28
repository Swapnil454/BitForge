"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "next-themes";
import UserTicketCenter from "../../components/help/UserTicketCenter";
import CreateTicketModal from "../CreateTicketModal";

export default function SupportHelpCenterPage({ params }: any) {
  const resolvedParams = use(params) as any;
  const { auth } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className={`h-[100dvh] md:h-screen flex flex-col overflow-hidden ${isDark ? "bg-[#0b1016]" : "bg-white"}`}>
      <div className={`shrink-0 px-4 py-3 md:px-6 md:py-4 border-b ${isDark ? "bg-[#202C33] border-white/10" : "bg-white border-slate-200"}`}>
        <h1 className={`text-lg md:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          Help & Support
        </h1>
      </div>

      <div className="h-[calc(100dvh-53px)] md:h-[calc(100vh-69px)] w-full flex-1 relative overflow-hidden">
        <UserTicketCenter 
          urlId={Array.isArray(resolvedParams?.id) ? resolvedParams.id[0] : resolvedParams?.id} 
          onNewTicket={() => setIsModalOpen(true)}
        />
      </div>

      {isModalOpen && (
        <CreateTicketModal 
          token={auth?.token}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </main>
  );
}
