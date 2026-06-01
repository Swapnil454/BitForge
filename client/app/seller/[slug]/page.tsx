import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import MarketplaceClient from "@/app/marketplace/MarketplaceClient";
import SellerHeader from "./components/SellerHeader";

async function getSellerBySlug(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sellers/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

async function getSellerById(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/sellers/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.seller; // backend returns { seller, products, reviews }
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);
  let seller = null;
  
  if (isMongoId) {
    seller = await getSellerById(slug);
  } else {
    seller = await getSellerBySlug(slug);
  }

  if (!seller) {
    return {
      title: "Seller Not Found | BitForge",
    };
  }

  return {
    title: `${seller.name} - Creator on BitForge`,
    description: seller.bio?.substring(0, 160) || `Check out digital products by ${seller.name} on BitForge.`,
    alternates: {
      canonical: `https://www.bittforge.in/seller/${slug}`,
    },
    openGraph: {
      title: `${seller.name} on BitForge`,
      description: seller.bio?.substring(0, 160) || `Check out digital products by ${seller.name} on BitForge.`,
      images: seller.profilePictureUrl ? [
        {
          url: seller.profilePictureUrl,
          width: 800,
          height: 800,
          alt: seller.name,
        }
      ] : [],
      url: `https://www.bittforge.in/seller/${slug}`,
      type: "profile",
    },
  };
}

export default async function SellerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);
  let seller = null;

  if (isMongoId) {
    seller = await getSellerById(slug);
    if (seller?.slug) {
      permanentRedirect(`/seller/${seller.slug}`);
    }
  } else {
    seller = await getSellerBySlug(slug);
  }

  if (!seller) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person", // or "Organization"
    name: seller.name,
    description: seller.bio,
    image: seller.profilePictureUrl,
    url: `https://www.bittforge.in/seller/${seller.slug}`,
    ...(seller.stats?.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: seller.stats.averageRating,
        reviewCount: seller.stats.ratingCount,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#020617] text-gray-900 dark:text-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Extract seller UI from MarketplaceClient or wrap it around */}
      <SellerHeader seller={seller} />
      
      <div className="-mt-16">
        <MarketplaceClient sellerSlug={seller.slug} />
      </div>
    </div>
  );
}
