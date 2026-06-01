import { Suspense } from "react";
import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "BitForge Marketplace — Buy & Sell Digital Products in India",
  description: "Discover and buy premium digital products on BitForge. Templates, tools, courses, and more from verified Indian creators. Instant download, secure payment.",
  alternates: {
    canonical: "https://www.bittforge.in/marketplace",
  },
  openGraph: {
    title: "BitForge Marketplace",
    description: "India's trusted digital product marketplace",
    url: "https://www.bittforge.in/marketplace",
    siteName: "BitForge",
    type: "website",
  },
};

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50 transition-colors flex items-center justify-center">Loading...</div>}>
      <MarketplaceClient />
    </Suspense>
  );
}
