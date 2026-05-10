"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { ShoppingCart, UserCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  isVerified: boolean;
  createdAt: string;
}

function AllUsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") as User["role"] | "all") || "buyer";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, roleParam]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleParam]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllUsers({
        page,
        limit: PAGE_SIZE,
        search: searchTerm,
        role: roleParam,
      });
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
      
      if (roleParam === "all") {
        setTotalCount(data.pagination?.total || 0);
      } else {
        setTotalCount(roleParam === "buyer" ? data.stats?.totalBuyers : data.stats?.totalSellers);
      }
    } catch (error: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const headerConfig = {
    buyer: { title: "Buyers", subtitle: "Manage all buyer accounts", icon: ShoppingCart },
    seller: { title: "Sellers", subtitle: "Manage all seller accounts", icon: UserCheck },
    admin: { title: "Admins", subtitle: "Manage admin accounts", icon: UserCheck },
    all: { title: "All Users", subtitle: "Manage all user accounts", icon: UserCheck },
  }[roleParam] || { title: "Users", subtitle: "Manage user accounts", icon: UserCheck };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white selection:bg-purple-500/30">
      <PageHeader
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        rightSlot={
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl shadow-2xl transition-all hover:bg-slate-200 dark:bg-white/[0.05]">
            <div className="flex flex-col items-center">
              <span className="text-[22px] font-black bg-clip-text text-transparent bg-gradient-to-b from-slate-800 to-slate-400 dark:from-white dark:to-white/40 leading-none">
                {totalCount}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 font-bold mt-1">Users</span>
            </div>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Search Bar - Full Width & Highlighted */}
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 dark:text-white/30 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search by name or email...`}
            className="w-full bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all shadow-2xl group-hover:bg-slate-50 dark:group-hover:bg-[#1a1a24]"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[88px] bg-slate-100 dark:bg-[#1c1c24] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
              ))
            ) : users.length > 0 ? (
              users.map((user, idx) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative bg-slate-100 dark:bg-[#1c1c24] hover:bg-slate-200 dark:hover:bg-[#23232d] border border-slate-200 dark:border-white/[0.05] hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar with Ring */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#1c1c26] border-2 border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-300 shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xl font-bold text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {user.name[0].toUpperCase()}
                        </span>
                      </div>
                      {user.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-1 border-[3px] border-[#0a0a0f] shadow-lg">
                          <UserCheck className="w-2.5 h-2.5 text-slate-900 dark:text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white/90 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate tracking-tight">
                          {user.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/[0.03] border border-slate-300 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">
                            {user.role}
                          </span>
                          {user.isVerified && (
                            <span className="flex items-center gap-1 text-emerald-400/80 text-[10px] font-bold">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-white/40 truncate mt-0.5 font-medium">{user.email}</p>
                    </div>

                    {/* Action */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/users/${user._id}`); }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.02] hover:bg-purple-500/20 border border-slate-200 dark:border-white/10 hover:border-purple-500/40 text-slate-400 dark:text-white/40 hover:text-purple-400 transition-all duration-300"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-sm">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-slate-400 dark:text-white/20" />
                </div>
                <h3 className="text-lg font-semibold text-slate-500 dark:text-white/60">No users found</h3>
                <p className="text-slate-400 dark:text-white/20 text-sm mt-1 px-4">Try adjusting your search to find what you're looking for.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 pb-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                // Only show a few pages if there are many
                if (totalPages > 5 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                  if (p === 2 || p === totalPages - 1) return <span key={p} className="text-slate-400 dark:text-white/20 px-1">...</span>;
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      page === p
                        ? "bg-purple-500 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/60"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AllUsersPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <AllUsersPageContent />
    </Suspense>
  );
}

function SkeletonPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="w-48 h-8 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="w-32 h-10 bg-slate-100 dark:bg-white/5 rounded-2xl" />
            <div className="w-56 h-4 bg-slate-100 dark:bg-white/5 rounded-lg" />
          </div>
          <div className="w-40 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        </div>
        <div className="w-full h-16 bg-slate-100 dark:bg-white/5 rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
