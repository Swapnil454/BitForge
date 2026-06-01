import { permanentRedirect, notFound } from "next/navigation";

async function getProductById(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/marketplace/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function LegacyMarketplacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product || !product.slug) {
    notFound();
  }

  // Use 301 permanent redirect for SEO migration
  permanentRedirect(`/product/${product.slug}`);
}
