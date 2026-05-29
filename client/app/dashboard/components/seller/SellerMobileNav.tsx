"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Megaphone, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function SellerMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/dashboard/seller", icon: Home },
    { label: "Products", href: "/dashboard/seller/products", icon: FolderOpen },
    // Upload is handled separately in the middle
    { label: "Promotions", href: "/dashboard/seller/promotions", icon: Megaphone },
    { label: "Settings", href: "/dashboard/seller/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[500] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-2 py-2 pb-safe flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around h-[72px] relative w-full max-w-md mx-auto">
        
        {navItems.slice(0, 2).map((item) => {
          const isActive = item.href === "/dashboard/seller" 
            ? pathname === "/dashboard/seller" 
            : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative"
            >
              <Icon className={`w-6 h-6 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] transition-colors ${isActive ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                {item.label}
              </span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
            </Link>
          );
        })}

        {/* Upload Floating Button */}
        <div className="w-16 flex items-center justify-center h-full relative">
          <Link 
            href="/dashboard/seller/upload"
            className={`absolute -top-7 flex flex-col items-center justify-center w-16 h-16 active:scale-95 transition-all ${pathname?.startsWith("/dashboard/seller/upload") ? "scale-110 drop-shadow-[0_4px_10px_rgba(79,70,229,0.4)]" : "drop-shadow-lg hover:scale-105"}`}
          >
            <img src="/upload_icon.png" alt="Upload" className="w-full h-full object-contain drop-shadow-sm" />
          </Link>
          <span className={`text-[10px] absolute bottom-[15px] transition-colors ${pathname?.startsWith("/dashboard/seller/upload") ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-500 dark:text-slate-400"}`}>
            Upload
          </span>
        </div>

        {navItems.slice(2, 4).map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative"
            >
              <Icon className={`w-6 h-6 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] transition-colors ${isActive ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                {item.label}
              </span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
