import { Metadata } from "next";
import { Suspense } from "react";
import MarketplaceClient from "@/app/marketplace/MarketplaceClient";

function getCategoryName(slug: string): string {
  // Convert "react-templates" to "React Templates"
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = getCategoryName(slug);
  
  return {
    title: `${categoryName} Digital Products | BitForge`,
    description: `Browse the best ${categoryName} on BitForge. High-quality digital assets from verified creators.`,
    alternates: {
      canonical: `https://www.bittforge.in/category/${slug}`,
    },
    openGraph: {
      title: `${categoryName} | BitForge`,
      description: `Discover premium ${categoryName}.`,
      url: `https://www.bittforge.in/category/${slug}`,
      siteName: "BitForge",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryName = getCategoryName(slug);
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50 flex items-center justify-center">Loading...</div>}>
      <MarketplaceClient initialCategory={categoryName} />
    </Suspense>
  );
}
