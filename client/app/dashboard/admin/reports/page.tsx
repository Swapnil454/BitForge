"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, 
  RefreshCw, 
  FileText, 
  AlertCircle,
  X,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Save,
  MessageSquare,
  UserRound,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

import { reportAPI } from "@/lib/api";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

// Format date helper
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateString));
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    case "under_review":
      return <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Under Review</span>;
    case "resolved":
      return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Resolved</span>;
    case "dismissed":
      return <span className="px-2.5 py-1 text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded-full flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Dismissed</span>;
    default:
      return <span className="px-2.5 py-1 text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30 rounded-full">{status}</span>;
  }
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  
  // Modal state
  const [actionStatus, setActionStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getAllReports({ status: statusFilter, limit: 50 });
      setReports(res.reports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = (report: any) => {
    setSelectedReport(report);
    setActionStatus(report.status);
    setAdminNotes(report.adminNotes || "");
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    
    try {
      setSaving(true);
      await reportAPI.updateReportStatus(selectedReport._id, {
        status: actionStatus,
        adminNotes: adminNotes
      });
      
      toast.success("Report updated successfully");
      setSelectedReport(null);
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white selection:bg-cyan-500/30">
      <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

      {/* Header */}
      <PageHeader 
        title="Reports Management"
        subtitle="Review, track, and resolve user appeals and platform reports."
        backHref="/dashboard/admin"
        backLabel="Dashboard"
        rightSlot={
          <button 
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        
        {/* Filters */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
          {["all", "pending", "under_review", "resolved", "dismissed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                statusFilter === status 
                  ? "bg-indigo-500 border-indigo-400 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/25" 
                  : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 mb-4">
              <ClipboardList className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No reports found</h3>
            <p className="text-slate-500 dark:text-white/60 max-w-md mx-auto">
              There are currently no reports matching the "{statusFilter.replace("_", " ")}" filter.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div 
                key={report._id}
                onClick={() => openReportModal(report)}
                className="bg-slate-50 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-[#0f0f15] transition-all cursor-pointer group shadow-lg hover:shadow-indigo-500/10 flex flex-col h-full relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-white/50 mb-1">{report.reportId}</p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{report.reporterEmail}</h3>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <div className="flex-1">
                  <div className="mb-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-200 dark:bg-white/10 rounded-md text-slate-700 dark:text-white/80">
                      Issue: {report.issueType.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-white/60 line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-400 dark:text-white/40">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(report.createdAt)}</span>
                  {report.proofUrls?.length > 0 && (
                    <span className="flex items-center gap-1 text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md">
                      <FileText className="w-3 h-3" /> {report.proofUrls.length} Proof(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 z-[60] bg-white dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-4 bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-[70] bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="shrink-0 p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100 dark:bg-white/5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Report {selectedReport.reportId}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-white/50 mt-1">Submitted on {formatDate(selectedReport.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
                
                {/* Reporter Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-xs text-slate-400 dark:text-white/50 mb-1 flex items-center gap-1.5"><UserRound className="w-3.5 h-3.5" /> Reporter</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedReport.reporterName || "Anonymous"}</p>
                    <p className="text-xs text-indigo-300 mt-0.5">{selectedReport.reporterEmail}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-xs text-slate-400 dark:text-white/50 mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Issue Type</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{selectedReport.issueType.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> Description
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>
                </div>

                {/* Proofs */}
                {selectedReport.proofUrls && selectedReport.proofUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-emerald-400" /> Attached Proofs
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedReport.proofUrls.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-black/50"
                        >
                          <img src={url} alt={`Proof ${index + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-6 h-6 text-slate-900 dark:text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Save className="w-4 h-4 text-rose-400" /> Admin Resolution
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2">Update Status</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { val: "pending", icon: Clock, color: "amber" },
                          { val: "under_review", icon: AlertCircle, color: "blue" },
                          { val: "resolved", icon: CheckCircle, color: "emerald" },
                          { val: "dismissed", icon: XCircle, color: "slate" },
                        ].map((s) => (
                          <button
                            key={s.val}
                            onClick={() => setActionStatus(s.val)}
                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                              actionStatus === s.val
                                ? `bg-${s.color}-500/20 border-${s.color}-500/50 text-${s.color}-300 shadow-lg shadow-${s.color}-500/10`
                                : `bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white`
                            }`}
                          >
                            <s.icon className="w-4 h-4" />
                            {s.val.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Admin Notes (visible to user)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Log your findings, actions taken, or reason for dismissal..."
                        className="w-full h-32 px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-white/30 focus:outline-hidden focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Trail (if resolved) */}
                {selectedReport.reviewedBy && (
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-800 dark:text-white/90 font-medium">Previously reviewed by {selectedReport.reviewedBy.name}</p>
                      <p className="text-xs text-slate-400 dark:text-white/50 mt-1">On {formatDate(selectedReport.reviewedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 p-5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving || (actionStatus === selectedReport.status && adminNotes === (selectedReport.adminNotes || ""))}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Resolution</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
