import { ModerationProduct, RiskLevel } from '@/types/moderation'

export function computeRisk(product: ModerationProduct): RiskLevel {
  // If the backend already calculated a severity, we should strongly consider it
  if (product.reviewSeverity === 'high') return 'high'
  if (product.reviewSeverity === 'medium') return 'medium'
  if (product.reviewSeverity === 'low') return 'low'

  let score = 0
  if (product.discountPercent > 50) score += 2
  if (!product.thumbnail) score += 1
  if (product.seller.approvedProducts === 0) score += 2
  if (product.seller.rejectedProducts > 2) score += 2
  if (product.seller.disputes > 0) score += 3
  if (product.seller.status === 'flagged') score += 4
  
  if (score >= 5) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}
