import { Suspense } from "react";
import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Marketplace | Buy Digital Products",
  description: "Discover premium courses, eBooks, templates, software, and design assets. Build your skills, launch your projects, and grow faster.",
};

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50 transition-colors flex items-center justify-center">Loading...</div>}>
      <MarketplaceClient />
    </Suspense>
  );
}
