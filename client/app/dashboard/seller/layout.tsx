import SellerMobileNav from "../components/seller/SellerMobileNav";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#05050a] pb-16 md:pb-0">
      {children}
      <SellerMobileNav />
    </div>
  );
}
