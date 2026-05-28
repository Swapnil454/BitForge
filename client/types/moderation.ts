export type RiskLevel = 'low' | 'medium' | 'high'
export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'
export type FileType = 'pdf' | 'zip' | 'template' | 'software' | 'video' | 'other'

export interface SellerTrust {
  id: string
  name: string
  email: string
  emailVerified: boolean
  totalProducts: number
  approvedProducts: number
  rejectedProducts: number
  disputes: number
  status: 'active' | 'suspended' | 'flagged'
  joinedAt: string
}

export interface ModerationEvent {
  timestamp: string
  action: string
  by?: string
  note?: string
}

export interface ModerationProduct {
  id: string
  title: string
  description: string
  category: string
  fileType: FileType
  fileCount: number
  thumbnail?: string
  price: number
  discountPercent: number
  finalPrice: number
  status: ProductStatus
  uploadedAt: string
  seller: SellerTrust
  history: ModerationEvent[]
  reviewSeverity?: 'high' | 'medium' | 'low'
  reviewFlags?: string[]
}
