"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Megaphone, CircleHelp, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminMobileNav() {
  const pathname = usePathname();

  // Hide the mobile navbar on specific pages where it overlaps with form actions
  if (
    pathname === "/dashboard/admin/bank-account/add" ||
    (pathname?.startsWith("/dashboard/admin/help-center/") && pathname !== "/dashboard/admin/help-center")
  ) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/dashboard/admin", icon: Home },
    { label: "Products", href: "/dashboard/admin/products", icon: FolderOpen },
    // Promotions is handled separately in the middle
    { label: "Security", href: "/dashboard/admin/security", icon: Shield },
    { label: "Support", href: "/dashboard/admin/help-center", icon: CircleHelp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[500] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] dark:shadow-none safe-area-pb transition-transform duration-200">
      <div className="flex items-center justify-around h-[72px] px-2 relative max-w-md mx-auto">
        
        {navItems.slice(0, 2).map((item) => {
          const isActive = item.href === "/dashboard/admin" 
            ? pathname === "/dashboard/admin" 
            : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 group relative"
            >
              <Icon className={`w-6 h-6 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
              <span className={`text-[10px] transition-colors ${isActive ? "font-semibold text-blue-600 dark:text-blue-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                {item.label}
              </span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>}
            </Link>
          );
        })}

        {/* Promotions Floating Button */}
        <div className="w-16 flex items-center justify-center h-full relative">
          <Link 
            href="/dashboard/admin/promotions"
            className={`absolute -top-5 flex flex-col items-center justify-center w-12 h-12 active:scale-95 transition-all ${pathname?.startsWith("/dashboard/admin/promotions") ? "scale-110 drop-shadow-[0_4px_10px_rgba(79,70,229,0.4)]" : "drop-shadow-lg hover:scale-105"}`}
          >
            <img src="/promotion_logo.png" alt="Promotions" className="w-full h-full object-contain drop-shadow-sm" />
          </Link>
          <span className={`text-[10px] absolute bottom-[15px] transition-colors ${pathname?.startsWith("/dashboard/admin/promotions") ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-500 dark:text-slate-400"}`}>
            Promotions
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
              <Icon className={`w-6 h-6 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
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
