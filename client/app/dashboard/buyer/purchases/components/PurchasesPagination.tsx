"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PurchasePagination } from "../types";

type PurchasesPaginationProps = {
  pagination: PurchasePagination;
  loading: boolean;
  onChangePage: (page: number) => void;
};

export default function PurchasesPagination({
  pagination,
  loading,
  onChangePage,
}: PurchasesPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-center sm:text-right text-white/40 text-sm">
        Showing page {pagination.page} of {pagination.totalPages} • {pagination.totalRecords} total
      </p>

      <div className="flex items-center justify-center sm:justify-end gap-3">
        <button
          type="button"
          onClick={() => onChangePage(pagination.page - 1)}
          disabled={!pagination.hasPrevPage || loading}
          className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>

        <span className="px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 text-sm font-semibold min-w-12 text-center">
          {pagination.page}
        </span>

        <button
          type="button"
          onClick={() => onChangePage(pagination.page + 1)}
          disabled={!pagination.hasNextPage || loading}
          className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
