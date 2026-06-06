import { Suspense } from "react";
import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = 'force-dynamic';

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

async function getInitialProducts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${apiUrl}/products/search?limit=40`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.products;
  } catch (err) {
    return undefined;
  }
}

export default async function MarketplacePage() {
  const initialProducts = await getInitialProducts();
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50 transition-colors flex items-center justify-center">Loading...</div>}>
      <MarketplaceClient initialHomeProducts={initialProducts} />
    </Suspense>
  );
}
