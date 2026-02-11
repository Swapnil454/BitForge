/**
 * Content Review Automation
 * Auto-review content based on heuristics and flag suspicious products
 */

/**
 * Auto-review content based on heuristics
 * Flag suspicious products for manual review
 * @param {Object} productData - Product data to review
 * @returns {Object} Review result with status and flags
 */
export function autoReviewContent(productData) {
  const flags = [];
  
  // Flag if page count is too low
  if (productData.pageCount && productData.pageCount < 3) {
    flags.push("Low page count (< 3 pages)");
  }
  
  // Flag if file size is suspiciously small
  if (productData.fileSizeBytes < 10000) { // < 10KB
    flags.push("Suspiciously small file (< 10KB)");
  }
  
  // Flag if price is unusually high for file size
  if (productData.price > 1000 && productData.fileSizeBytes < 100000) {
    flags.push("High price for small file");
  }
  
  // Flag if price is suspiciously low (possible piracy)
  if (productData.price < 10 && productData.fileSizeBytes > 10000000) { // >10MB
    flags.push("Suspiciously low price for large file");
  }
  
  // Flag if title contains suspicious keywords
  const suspiciousKeywords = ['crack', 'keygen', 'pirate', 'free download', 'leaked'];
  const titleLower = (productData.title || '').toLowerCase();
  if (suspiciousKeywords.some(keyword => titleLower.includes(keyword))) {
    flags.push("Suspicious keywords in title");
  }
  
  // If multiple flags, require manual review
  if (flags.length >= 2) {
    return {
      status: "not-reviewed",
      requiresManualReview: true,
      flags,
      severity: "high"
    };
  }
  
  // Single flag = medium priority manual review
  if (flags.length === 1) {
    return {
      status: "not-reviewed",
      requiresManualReview: true,
      flags,
      severity: "medium"
    };
  }
  
  // No flags = auto-approve for content review
  return {
    status: "auto-reviewed",
    requiresManualReview: false,
    flags: [],
    severity: "none"
  };
}

/**
 * Calculate content quality score (0-100)
 * @param {Object} productData - Product data
 * @returns {number} Quality score
 */
export function calculateContentQualityScore(productData) {
  let score = 50; // Start at baseline
  
  // Bonus points for good practices
  if (productData.pageCount > 10) score += 10;
  if (productData.pageCount > 50) score += 10;
  if (productData.description && productData.description.length > 200) score += 10;
  if (productData.thumbnailUrl) score += 10;
  if (productData.previewPages && productData.previewPages.length > 0) score += 10;
  
  // Penalty points for red flags
  if (productData.pageCount < 5) score -= 15;
  if (productData.fileSizeBytes < 50000) score -= 10;
  if (!productData.description || productData.description.length < 50) score -= 15;
  
  // Cap between 0-100
  return Math.max(0, Math.min(100, score));
}
