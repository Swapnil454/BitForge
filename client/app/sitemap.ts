import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blogData'

/**
 * Production-Level Dynamic Sitemap
 * Automatically generates sitemap.xml for search engines
 * Follows Google's best practices for SEO optimization
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bittforge.in'
  const currentDate = new Date()

  // Core pages with highest priority
  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/marketplace`, 
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Trust & Security pages
  const trustPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/trust-center`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/seller-terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Legal pages
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/legal/terms-and-conditions`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/refund-cancellation-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ]

  // Documentation pages
  const docPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/docs`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/docs/quick-start`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/docs/api-keys-setup`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/oauth-setup`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/bank-account-setup`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/payout-system`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/product-management`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/product-changes`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/security`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/docs/rate-limits`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/webhooks`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/docs/testing`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/docs/troubleshooting`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // Dynamic Blog Posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Dynamic Product Pages
  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];
  let sellerPages: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Limit to 500 products to prevent massive build delays
    const res = await fetch(`${apiUrl}/marketplace?limit=500`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.products) {
        
        // 1. Generate Product Pages
        productPages = data.products
          .filter((product: any) => product.slug) // Ensure it has a slug
          .map((product: any) => ({
            url: `${baseUrl}/product/${product.slug}`,
            lastModified: new Date(product.updatedAt || product.createdAt || currentDate),
            changeFrequency: 'weekly',
            priority: 0.9, // High priority for products
          }));

        // 2. Generate Category Pages
        const uniqueCategories = new Set<string>();
        data.products.forEach((product: any) => {
          if (product.categorySlug) {
            uniqueCategories.add(product.categorySlug);
          }
        });

        categoryPages = Array.from(uniqueCategories).map((slug) => ({
          url: `${baseUrl}/category/${slug}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));

        // 3. Generate Seller Pages
        const uniqueSellers = new Map<string, any>();
        data.products.forEach((product: any) => {
          if (product.sellerId && product.sellerId.slug) {
            uniqueSellers.set(product.sellerId.slug, product.sellerId);
          }
        });

        sellerPages = Array.from(uniqueSellers.values()).map((seller: any) => ({
          url: `${baseUrl}/seller/${seller.slug}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }
    }
  } catch (e) {
    console.error("Sitemap Generation: Could not fetch products from backend API", e);
  }

  return [
    ...corePages,
    ...blogPages,
    ...productPages,
    ...categoryPages,
    ...sellerPages,
    ...trustPages,
    ...legalPages,
    ...docPages,
  ]
}
