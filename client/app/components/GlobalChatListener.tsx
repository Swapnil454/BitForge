"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { getCookie, getStoredUser } from "@/lib/cookies";
import { toast } from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";

export default function GlobalChatListener() {
  const router = useRouter();
  const pathname = usePathname();
  // Fetch user object to check auth and role
  const userStr = getCookie("user");
  let user: any = null;
  if (userStr && userStr !== '""') {
    try {
      user = JSON.parse(userStr as string);
    } catch(e) {}
  }

  useEffect(() => {
    if (!user || !user.id) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiBase.replace(/\/api$/, "");
    const token = getCookie("token");

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socket.on("ticket:new-message", (newMsg: any) => {
      const isSupportPage = pathname?.startsWith("/dashboard/support");
      const isAdminHelpCenter = pathname?.startsWith("/dashboard/admin/help-center");

      // Don't show toast if user is actively viewing this exact ticket's chat window
      if (isSupportPage && pathname === `/dashboard/support/${newMsg.ticketId}`) return;
      if (isAdminHelpCenter && pathname === `/dashboard/admin/help-center/${newMsg.ticketId}`) return;

      if (newMsg.from?._id !== user.id && newMsg.from !== user.id) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-[#202C33] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black/5 cursor-pointer`} 
               onClick={() => { 
                 toast.dismiss(t.id); 
                 if (user.role === 'admin' || user.role === 'superadmin') {
                   router.push(`/dashboard/admin/help-center/${newMsg.ticketId}`);
                 } else {
                   router.push(`/dashboard/support/${newMsg.ticketId}`);
                 }
               }}>
            <div className="flex-1 w-0 p-3">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                    {newMsg.fromRole === 'admin' ? "Support Agent" : (newMsg.from?.name || "User")}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white truncate">
                    {newMsg.message || "Sent an attachment"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), { duration: 4000, position: 'top-right' });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, user?.role, pathname, router]);

  return null;
}
