"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  sellerId: Seller;
  thumbnailUrl?: string;
  createdAt: string;
  rejectionReason?: string;
}

const PAGE_SIZE = 6;

export default function ProductsManagementPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "approved" | "pending" | "rejected">("all");

  const [page, setPage] = useState(1);
  const [statusOpen, setStatusOpen] = useState(false);


  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await adminAPI.getAllProducts();
        setProducts(data || []);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ---------------- OPTIMISTIC FILTER ---------------- */
  useEffect(() => {
    setListLoading(true);
    setPage(1);

    const t = setTimeout(() => {
      let list = products;

      if (statusFilter !== "all") {
        list = list.filter((p) => p.status === statusFilter);
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.sellerId?.name?.toLowerCase().includes(term)
        );
      }

      setFilteredProducts(list);
      setListLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, [products, statusFilter, searchTerm]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const count = {
    all: products.length,
    approved: products.filter((p) => p.status === "approved").length,
    pending: products.filter((p) => p.status === "pending").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };

  if (loading) return <ProductsPageSkeleton />;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold">📦 Products</h1>
        <p className="text-white/60 mb-5">
          Manage approved, pending and rejected products
        </p>

        {/* 🔥 SEARCH + STATUS (ONE ROW ALWAYS) */}
        <div className="flex items-center gap-3 mb-4 flex-nowrap">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, description or seller…"
            className="flex-1 min-w-0 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-cyan-400 focus:outline-none"
          />

          {/* Glass Select Wrapper */}
          <div className="relative shrink-0">
  {/* Trigger */}
  <button
    onClick={() => setStatusOpen((v) => !v)}
    className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition"
  >
    <span className="capitalize">
      {statusFilter === "all" ? "All Status" : statusFilter}
    </span>
    <span className="text-white/50">▾</span>
  </button>

  {/* Dropdown */}
  {statusOpen && (
    <div
      className="absolute right-0 mt-2 w-36 rounded-xl bg-[#0b0b14]/90 backdrop-blur-xl border border-white/10 shadow-xl z-50"
      onMouseLeave={() => setStatusOpen(false)}
    >
      {(["all", "approved", "pending", "rejected"] as const).map((status) => (
        <button
          key={status}
          onClick={() => {
            setStatusFilter(status);
            setStatusOpen(false);
          }}
          className={`w-full text-left px-4 py-2 text-sm capitalize transition
            ${
              statusFilter === status
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/10"
            }`}
        >
          {status === "all" ? "All Status" : status}
        </button>
      ))}
    </div>
  )}
</div>

        </div>

        {/* 🔥 STATS (ONE ROW, SCROLLABLE) */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar flex-nowrap">
          {(["all", "approved", "pending", "rejected"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm transition ${
                statusFilter === key
                  ? "bg-white/15 border-white/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="capitalize">{key}</span>
              <span className="ml-2 text-white/60">{count[key]}</span>
            </button>
          ))}
        </div>

        {/* PRODUCTS */}
        {listLoading ? (
          <ProductsListSkeleton />
        ) : paginatedProducts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/60">No products found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedProducts.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "📦"
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {product.title}
                    </h3>
                    <p className="text-white/70 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/admin/products-management/${product._id}`
                      )
                    }
                    className="shrink-0 h-8 px-3 bg-blue-600/90 hover:bg-blue-600 rounded-md text-xs font-medium"
                  >
                    View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!listLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-white/10 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-white/60">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white/10 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- SKELETONS ---------------- */

function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a14] via-[#0f0f1e] to-[#14142b] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="w-40 h-6 bg-white/10 rounded" />
        <div className="w-72 h-4 bg-white/10 rounded" />
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-white/10 rounded-lg" />
          <div className="w-36 h-10 bg-white/10 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-9 bg-white/10 rounded-full" />
          ))}
        </div>
        <ProductsListSkeleton />
      </div>
    </div>
  );
}

function ProductsListSkeleton() {
  return (
    <div className="grid gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 flex gap-4"
        >
          <div className="w-16 h-16 bg-white/10 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="w-48 h-4 bg-white/10 rounded" />
            <div className="w-full h-3 bg-white/10 rounded" />
            <div className="w-2/3 h-3 bg-white/10 rounded" />
          </div>
          <div className="w-20 h-9 bg-white/10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

