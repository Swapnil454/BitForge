"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "next-themes";
import UserTicketCenter from "../../components/help/UserTicketCenter";
import CreateTicketModal from "../CreateTicketModal";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupportHelpCenterPage({ params }: any) {
  const resolvedParams = use(params) as any;
  const { auth } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className={`h-[100dvh] md:h-screen flex flex-col overflow-hidden ${isDark ? "bg-[#0b1016]" : "bg-white"}`}>
      <div className={`shrink-0 px-4 py-3 md:px-6 md:py-4 border-b items-center gap-3 ${isDark ? "bg-[#202C33] border-white/10" : "bg-white border-slate-200"} ${isChatOpen ? "hidden md:flex" : "flex"}`}>
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-full transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white" : "bg-white shadow-sm hover:shadow text-slate-600 hover:text-slate-900"}`}
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-lg md:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          Help & Support
        </h1>
      </div>

      <div className={`${isChatOpen ? "h-[100dvh]" : "h-[calc(100dvh-53px)]"} md:h-[calc(100vh-69px)] w-full flex-1 relative overflow-hidden`}>
        <UserTicketCenter 
          urlId={Array.isArray(resolvedParams?.id) ? resolvedParams.id[0] : resolvedParams?.id} 
          onChatOpenChange={setIsChatOpen}
        />
      </div>
    </main>
  );
}
