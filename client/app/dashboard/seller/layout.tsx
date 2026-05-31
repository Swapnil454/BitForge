import SellerMobileNav from "../components/seller/SellerMobileNav";
import SwipeNavigation from "../components/seller/SwipeNavigation";
import SellerGuard from "../components/seller/SellerGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] pb-16 md:pb-0">
      <SellerGuard />
      <SwipeNavigation>
        {children}
      </SwipeNavigation>
      <SellerMobileNav />
    </div>
  );
}
