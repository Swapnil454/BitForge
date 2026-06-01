export interface Purchase {
  _id: string;
  orderId: string;
  productName: string;
  productId: string | null;
  productSlug?: string | null;
  thumbnailUrl: string | null;
  sellerName: string;
  amount: number;
  status: string;
  purchaseDate: string;
  downloadCount?: number;
  downloadLimit?: number;
}

export interface PurchasePagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
