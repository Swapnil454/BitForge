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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <button
        type="button"
        onClick={() => onChangePage(pagination.page - 1)}
        disabled={!pagination.hasPrevPage || loading}
        className="h-8 rounded-lg border border-white/15 px-2.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <p className="text-xs sm:text-sm text-white/70">
        Page <span className="text-white font-semibold">{pagination.page}</span> of{" "}
        <span className="text-white font-semibold">{pagination.totalPages}</span>
      </p>

      <button
        type="button"
        onClick={() => onChangePage(pagination.page + 1)}
        disabled={!pagination.hasNextPage || loading}
        className="h-8 rounded-lg border border-white/15 px-2.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
