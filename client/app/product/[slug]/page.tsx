import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";

async function getProductBySlug(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const url = `${apiUrl}/marketplace/slug/${slug}`;
  console.log(`[getProductBySlug] Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });
    console.log(`[getProductBySlug] Response status: ${res.status}`);
    if (!res.ok) {
      console.log(`[getProductBySlug] Fetch failed: ${await res.text()}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`[getProductBySlug] Fetch error:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | BitForge",
      description: "The requested product could not be found.",
    };
  }

  return {
    title: `${product.title} | BitForge`,
    description: product.description.substring(0, 160),
    alternates: {
      canonical: `https://www.bittforge.in/product/${slug}`,
    },
    openGraph: {
      title: product.title,
      description: product.description.substring(0, 160),
      images: [
        {
          url: product.thumbnailUrl || "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description.substring(0, 160),
      images: [product.thumbnailUrl || "/og-image.jpg"],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const finalPrice = product.discount > 0 
    ? Math.max(product.price - (product.price * product.discount) / 100, 0)
    : product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.thumbnailUrl,
    sku: product._id,
    brand: {
      "@type": "Brand",
      name: "BitForge",
    },
    offers: {
      "@type": "Offer",
      url: `https://bittforge.in/product/${product.slug}`,
      priceCurrency: "INR",
      price: finalPrice,
      availability: "https://schema.org/InStock",
    },
    ...(product.sellerStats?.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.sellerStats.averageRating,
        reviewCount: product.sellerStats.ratingCount,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient initialProduct={product} />
    </>
  );
}
