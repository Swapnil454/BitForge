"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserRound, Mail, ShieldAlert, CheckCircle2, ShieldCheck, 
  Store, ShoppingBag, AlertTriangle, MessageSquareWarning, Calendar, Clock
} from "lucide-react";
import toast from "react-hot-toast";

import { adminAPI } from "@/lib/api";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  profilePictureUrl?: string;
  isVerified: boolean;
  accountStatus: "active" | "deleted" | "banned";
  bannedReason?: string;
  accountStatusUpdatedAt?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  totalProducts?: number;
  totalOrders?: number;
}

export default function AdminUserDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUserById(id);
      setUser(res.user);
      setStats(res.stats);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user details");
      router.push("/dashboard/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banReason.trim() || banReason.trim().length < 5) {
      toast.error("Please provide a valid reason (min 5 chars)");
      return;
    }
    
    try {
      setIsProcessing(true);
      await adminAPI.deleteUser(id, banReason.trim());
      toast.success("User has been banned successfully");
      setShowBanModal(false);
      fetchUser();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanUser = async () => {
    try {
      setIsProcessing(true);
      await adminAPI.unbanUser(id);
      toast.success("User has been unbanned successfully");
      fetchUser();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#05050a] text-white selection:bg-cyan-500/30">
      
      {/* Header */}
      <PageHeader 
        title="User Management"
        subtitle={`Detailed view of ${user.name}'s account`}
        backHref="/dashboard/admin/users"
        rightSlot={
          user.role !== 'admin' && (
            <div className="flex items-center gap-3">
              {user.accountStatus === 'banned' ? (
                <button
                  onClick={handleUnbanUser}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/10"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Unban User</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowBanModal(true)}
                  disabled={user.accountStatus === 'deleted'}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-xl font-medium transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span className="hidden sm:inline">Ban User</span>
                </button>
              )}
            </div>
          )
        }
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Status Alerts */}
        {user.accountStatus === 'banned' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex gap-4"
          >
            <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-rose-400 font-bold text-lg mb-1">Account Suspended</h3>
              <p className="text-white/80">
                This user is currently banned and cannot access their account.
                <br/>
                <span className="text-rose-300 font-medium mt-1 inline-block">Reason: {user.bannedReason}</span>
              </p>
              {user.accountStatusUpdatedAt && (
                <p className="text-white/40 text-xs mt-2">
                  Banned on: {new Date(user.accountStatusUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {user.accountStatus === 'deleted' && (
          <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex gap-4">
            <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-orange-400 font-bold text-lg mb-1">Account Deleted</h3>
              <p className="text-white/80">
                This account was scheduled for deletion by the user or admin. It is no longer active.
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 overflow-hidden mb-4 relative">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-12 h-12 absolute inset-0 m-auto text-indigo-400/50" />
                  )}
                  {user.isVerified && (
                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 shadow-lg shadow-emerald-500/50">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                <div className="flex items-center justify-center gap-2 text-white/60 mb-4">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/80 capitalize">
                    {user.role}
                  </span>
                  <span className={`px-3 py-1 border rounded-full text-xs font-medium capitalize ${
                    user.accountStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    user.accountStatus === 'banned' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  }`}>
                    {user.accountStatus}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/10 text-sm w-full">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 flex items-center gap-2"><Calendar className="h-4 w-4" /> Joined</span>
                  <span className="text-white/80 font-medium">
                    {new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(user.createdAt))}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white/40 flex items-center gap-2"><Clock className="h-4 w-4" /> Last Login</span>
                  <span className="text-white/80 font-medium">
                    {user.lastLogin ? new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(user.lastLogin)) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {user.role === 'seller' && (
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 hover:border-indigo-500/40 transition-colors shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                      <Store className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-medium text-white/60 mb-1 relative z-10">Total Products</h3>
                  <p className="text-4xl font-bold text-white relative z-10">{stats?.totalProducts || 0}</p>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6 hover:border-cyan-500/40 transition-colors shadow-lg shadow-cyan-500/5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-medium text-white/60 mb-1 relative z-10">Total Orders</h3>
                <p className="text-4xl font-bold text-white relative z-10">{stats?.totalOrders || 0}</p>
              </div>
            </div>

            {/* Account Activity Summary */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" /> Account Security
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className={`p-3 rounded-full ${user.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Email Verification</h4>
                    <p className="text-sm text-white/50">{user.isVerified ? 'Email has been verified' : 'Email pending verification'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className={`p-3 rounded-full ${user.accountStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Account Status</h4>
                    <p className="text-sm text-white/50 capitalize">Currently {user.accountStatus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-rose-900/20"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-4">
                <ShieldAlert className="h-6 w-6" />
                <h3 className="text-xl font-bold">Ban User</h3>
              </div>
              <p className="text-white/70 text-sm mb-6">
                You are about to ban <strong>{user.name}</strong>. They will be immediately logged out and prevented from signing in. Their data will be preserved.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Reason for Ban (Required)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-hidden focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 resize-none h-24"
                  placeholder="E.g., Violation of terms, fraudulent activity..."
                />
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowBanModal(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-white/60 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm Ban"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="min-h-screen bg-[#05050a] p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-20 bg-white/5 rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-96 bg-white/5 rounded-3xl" />
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-white/5 rounded-3xl" />
              <div className="h-32 bg-white/5 rounded-3xl" />
            </div>
            <div className="h-64 bg-white/5 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
