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
    { label: "Promotions", href: "/dashboard/seller/promotions", icon: Megaphone },
    { label: "Settings", href: "/dashboard/seller/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-2 pb-safe flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center w-16 h-12 transition-all duration-300 ${
              isActive 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute -top-2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-110 mb-0.5' : 'scale-100 mb-1'}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
