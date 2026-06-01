"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { marketplaceAPI } from "@/lib/api";
import { ProductType } from "@/app/components/buyer/product/ProductCard";

interface UseInfiniteProductsOptions {
  category?: string;
  sort?: "newest" | "trending" | "rating" | "price_asc" | "price_desc";
  search?: string;
  limit?: number;
  sellerId?: string;
  sellerSlug?: string;
  /** Pass false to pause fetching (e.g. when on home page that doesn't use grid view) */
  enabled?: boolean;
}

interface UseInfiniteProductsReturn {
  products: ProductType[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: string | null;
  sentinelRef: React.RefCallback<HTMLElement>;
  reset: () => void;
}

const PAGE_SIZE = 8;

export function useInfiniteProducts({
  category,
  sort = "newest",
  search,
  limit = PAGE_SIZE,
  sellerId,
  sellerSlug,
  enabled = true,
}: UseInfiniteProductsOptions = {}): UseInfiniteProductsReturn {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether the initial fetch already happened for current params
  const initialFetchDone = useRef(false);
  const currentParams = useRef({ category, sort, search, sellerId, sellerSlug });

  // Reset when params change
  const reset = useCallback(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    initialFetchDone.current = false;
  }, []);

  // Detect param changes and reset
  useEffect(() => {
    const prev = currentParams.current;
    if (
      prev.category !== category ||
      prev.sort !== sort ||
      prev.search !== search ||
      prev.sellerId !== sellerId ||
      prev.sellerSlug !== sellerSlug
    ) {
      currentParams.current = { category, sort, search, sellerId, sellerSlug };
      reset();
    }
  }, [category, sort, search, sellerId, sellerSlug, reset]);

  // Fetch a specific page
  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (!enabled) return;

      const cacheKey = `products_cache_${JSON.stringify({ category, sort, search, sellerId, sellerSlug, page: pageNum })}`;
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

      try {
        if (pageNum === 1) {
          // Page 1: try cache first for instant render
          try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
              const { data, ts } = JSON.parse(cached);
              if (Date.now() - ts < CACHE_TTL && data?.length > 0) {
                setProducts(data);
                setHasMore(data.length >= limit);
                setIsLoading(false);
                // Still fetch in background silently — don't show spinner
              } else {
                setIsLoading(true);
              }
            } else {
              setIsLoading(true);
            }
          } catch (_) {
            setIsLoading(true);
          }
        } else {
          setIsFetchingMore(true);
        }

        const data = await marketplaceAPI.getAllProducts({
          page: pageNum,
          limit,
          category: category || undefined,
          sort,
          search: search || undefined,
          sellerId: sellerId || undefined,
          sellerSlug: sellerSlug || undefined,
        });

        const incoming: ProductType[] = data.products || [];

        setProducts((prev) =>
          pageNum === 1 ? incoming : [...prev, ...incoming]
        );
        setHasMore(data.hasMore ?? incoming.length >= limit);
        setError(null);

        // Cache page 1 results
        if (pageNum === 1) {
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: incoming, ts: Date.now() })); } catch (_) {}
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load products");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [category, sort, search, limit, sellerId, sellerSlug, enabled]
  );

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchPage(1);
  }, [enabled, fetchPage]);

  // Subsequent pages (triggered by page state increment)
  useEffect(() => {
    if (!enabled) return;
    if (page === 1) return; // already handled by initial load
    fetchPage(page);
  }, [page, enabled, fetchPage]);

  // IntersectionObserver sentinel
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef: React.RefCallback<HTMLElement> = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
            setPage((p) => p + 1);
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasMore, isLoading, isFetchingMore]
  );

  return { products, isLoading, isFetchingMore, hasMore, error, sentinelRef, reset };
}
