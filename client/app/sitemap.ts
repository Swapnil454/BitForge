import { MetadataRoute } from 'next'

/**
 * Production-Level Dynamic Sitemap
 * Automatically generates sitemap.xml for search engines
 * Follows Google's best practices for SEO optimization
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bittforge.in'
  const currentDate = new Date()

  // Core pages with highest priority
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/marketplace`, 
      lastModified: currentDate,
      changeFrequency: 'hourly',
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

  // Documentation pages (for developers and sellers)
  const docPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/docs`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs/quick-start`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/api-keys-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/oauth-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/bank-account-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/payout-system`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/product-management`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/product-changes`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/security`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/rate-limits`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/docs/webhooks`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/testing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/docs/troubleshooting`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs/upload-solutions`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/docs/seller-deletion`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/docs/approved-changes`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Combine all pages
  return [
    ...corePages,
    ...trustPages,
    ...legalPages,
    ...docPages,
  ]
}

/**
 * SITEMAP BEST PRACTICES IMPLEMENTED:
 * 
 * 1. Priority Values:
 *    - 1.0: Homepage (most important)
 *    - 0.9: Marketplace (core business page)
 *    - 0.8: About, Contact, Trust Center (important pages)
 *    - 0.7: Careers, Seller Terms (secondary pages)
 *    - 0.6: Legal, Main Docs (required but less traffic)
 *    - 0.4-0.5: Specific documentation pages
 * 
 * 2. Change Frequency:
 *    - hourly: Marketplace (products updated frequently)
 *    - daily: Homepage (featured content changes)
 *    - weekly: Careers, Main Docs, Troubleshooting
 *    - monthly: Most documentation and info pages
 *    - yearly: Legal pages (rarely change)
 * 
 * 3. Excluded Pages (via robots.txt):
 *    - /login, /register (auth pages)
 *    - /dashboard/* (user-specific)
 *    - /api/* (API endpoints)
 *    - /cart, /notifications (private)
 *    - /pending-approval/* (admin only)
 * 
 * 4. Dynamic Generation:
 *    - Next.js automatically generates sitemap.xml
 *    - Accessible at: https://bittforge.in/sitemap.xml
 *    - Updates on each build/deployment
 * 
 * 5. To Add Product URLs Dynamically:
 *    - Fetch products from database
 *    - Add to sitemap with priority 0.7-0.8
 *    - Update changeFrequency to 'daily' or 'hourly'
 */
