"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X,
  Inbox,
  FileText,
  Download,
  Paperclip,
  ChevronDown
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

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  
  // Modal/Drawer state
  const [actionStatus, setActionStatus] = useState("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Observer ref for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  const getOriginalName = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || "proof-image";
    } catch (e) {
      return url.split('/').pop()?.split('?')[0] || "proof-image";
    }
  };

  const handleDownloadImage = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getOriginalName(url);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, "_blank");
    }
  };

  const fetchReports = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await reportAPI.getAllReports({ 
        status: statusFilter, 
        limit: 7,
        page: pageNum
      });
      
      const newReports = res.reports || [];
      
      if (pageNum === 1) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }
      
      setHasMore(newReports.length === 7);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchReports(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore, page, statusFilter]);

  const openReportModal = (report: any) => {
    setSelectedReport(report);
    setActionStatus(report.status);
    setAdminNotes(report.adminNotes || "");
  };

  const handleQuickAction = async (reportId: string, status: string) => {
    try {
      await reportAPI.updateReportStatus(reportId, { status });
      toast.success("Report updated successfully");
      fetchReports(1);
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    }
  };

  const handleDrawerAction = async (status: string) => {
    if (!selectedReport) return;
    try {
      setSaving(true);
      await reportAPI.updateReportStatus(selectedReport._id, {
        status,
        adminNotes
      });
      toast.success("Report updated successfully");
      setSelectedReport(null);
      fetchReports(1);
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    try {
      setSaving(true);
      await reportAPI.updateReportStatus(selectedReport._id, {
        status: selectedReport.status, // preserve current status
        adminNotes
      });
      toast.success("Notes saved successfully");
      fetchReports();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const getCount = (status: string) => {
    if (status === 'all') return reports.length;
    return reports.filter(r => r.status === status).length;
  };

  const getSeverityBorder = (type: string) => {
    const t = (type || "").toLowerCase().replace(/_/g, " ");
    if (t.includes("account restricted") || t.includes("fraud")) return "border-red-400";
    if (t.includes("data privacy") || t.includes("abuse")) return "border-amber-400";
    return "border-blue-400";
  };

  const getSeverityDot = (type: string) => {
    const t = (type || "").toLowerCase().replace(/_/g, " ");
    if (t.includes("account restricted") || t.includes("fraud")) return "bg-red-400";
    if (t.includes("data privacy") || t.includes("abuse")) return "bg-amber-400";
    return "bg-blue-400";
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Under Review
          </span>
        );
      case 'resolved':
        return (
          <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 capitalize">
            {status.replace("_", " ")}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#05050a]">
      {/* PAGE HEADER */}
      <PageHeader 
        title="Reports Management"
        subtitle="Resolve appeals and platform reports"
        backHref="/dashboard/admin"
        backLabel="Dashboard"
      />

      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
        
        {/* FILTER PILLS */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {["all", "pending", "under_review", "resolved", "dismissed"].map(status => {
            const isActive = statusFilter === status;
            const count = getCount(status);
            
            let countBadgeClass = "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400";
            if (isActive) {
              countBadgeClass = "bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white";
            } else if (count > 0) {
              if (status === 'pending') countBadgeClass = "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
              else if (status === 'under_review') countBadgeClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";
            }

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={
                  isActive 
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center transition-colors whitespace-nowrap shrink-0"
                    : "bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center shadow-sm whitespace-nowrap shrink-0"
                }
              >
                <span className="capitalize">{status.replace("_", " ")}</span>
                <span className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold ml-1.5 ${countBadgeClass}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* REPORT LIST */}
        <div className="bg-white dark:bg-[#13131a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500">No {statusFilter.replace("_", " ")} reports</h3>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">All caught up.</p>
            </div>
          ) : (
            reports.map(report => (
              <div 
                key={report._id}
                className={`flex flex-wrap sm:flex-nowrap items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors duration-150 border-l-4 ${getSeverityBorder(report.issueType)}`}
              >
                {/* 1. SEVERITY INDICATOR */}
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityDot(report.issueType)}`} />
                
                {/* 2. MAIN CONTENT */}
                <div className="flex-1 min-w-0">
                  {/* Primary Row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <span className="text-[11px] sm:text-xs font-mono text-gray-500 dark:text-gray-400">{report.reportId}</span>
                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">·</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-full">{report.reporterEmail}</span>
                    {report.targetName && (
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-full sm:w-auto truncate">→ {report.targetName}</span>
                    )}
                  </div>
                  
                  {/* Secondary Row - Description */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{report.description}</p>
                  </div>
                  
                  {/* Tertiary Row - Tags & Meta */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-md px-2 py-1 font-medium capitalize">
                      {report.issueType.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(report.createdAt)}
                    </div>
                    {report.proofUrls?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        {report.proofUrls.length} Proof(s)
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. RIGHT SECTION (Status & View) */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto ml-5 sm:ml-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                  {renderStatusBadge(report.status)}
                  <button 
                    onClick={() => openReportModal(report)}
                    className="text-xs rounded-lg px-3 py-1.5 font-medium border transition-colors bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Infinite Scroll Target */}
          {!loading && hasMore && reports.length > 0 && (
            <div ref={observerTarget} className="w-full py-8 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}
          {!loading && !hasMore && reports.length > 0 && (
            <div className="w-full py-8 flex items-center justify-center">
              <span className="text-sm text-gray-500">No more reports to load.</span>
            </div>
          )}
        </div>
      </div>

      {/* REPORT DETAIL DRAWER */}
      <AnimatePresence>
        {selectedReport && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/20 z-[998]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-[#13131a] shadow-2xl border-l border-gray-200 dark:border-white/10 z-[999] flex flex-col pb-safe"
            >
              {/* Drawer header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-none">{selectedReport.reportId}</h2>
                  <div className="inline-block scale-90 origin-left">
                    {renderStatusBadge(selectedReport.status)}
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mt-1 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto">
                {/* 1. Reporter Info */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Reporter Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Email</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate" title={selectedReport.reporterEmail}>{selectedReport.reporterEmail}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">Name</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">{selectedReport.reporterName || "Anonymous"}</span>
                    </div>
                    {selectedReport.reporterJoinedDate && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-gray-500 dark:text-gray-400 shrink-0">Joined</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedReport.reporterJoinedDate)}</span>
                      </div>
                    )}
                    {selectedReport.reportCount !== undefined && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-gray-500 dark:text-gray-400 shrink-0">Total Reports</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReport.reportCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Issue Details */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Issue Details</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Issue Type</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">{selectedReport.issueType.replace("_", " ")}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Submitted</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{formatDate(selectedReport.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Description</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Proof Files */}
                {selectedReport.proofUrls?.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Proof Files</h3>
                    <div className="space-y-2">
                      {selectedReport.proofUrls.map((url: string, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => setLightboxImage(url)}
                          className="w-full flex items-center text-left gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">Proof_{idx + 1}</span>
                          <Download 
                            onClick={(e) => handleDownloadImage(url, e)} 
                            className="w-4 h-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Admin Notes */}
                <div className="px-5 py-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Admin Notes</h3>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes..."
                      className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b0b12] rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20"
                    />
                    <button 
                      onClick={handleSaveNotes}
                      disabled={saving}
                      className="self-end text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Action Rail at bottom */}
              <div className="p-4 border-t border-gray-200 dark:border-white/10 shrink-0 bg-gray-50 dark:bg-[#05050a] flex items-center gap-3 relative">
                <div className="relative flex-1">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full text-left text-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#13131a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/20 font-medium flex items-center justify-between"
                  >
                    <span className="capitalize">{actionStatus.replace(/_/g, " ")}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-[#13131a] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                        {['pending', 'under_review', 'resolved', 'dismissed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => { setActionStatus(status); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${actionStatus === status ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  disabled={saving || actionStatus === selectedReport.status}
                  onClick={() => handleDrawerAction(actionStatus)}
                  className="text-sm rounded-lg px-6 py-2 font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setLightboxImage(null)}
          >
            <div className="flex flex-col w-full max-w-[700px] gap-3">
              {/* Action Buttons Above Image */}
              <div className="flex flex-row gap-2 self-end">
                <button
                  onClick={(e) => handleDownloadImage(lightboxImage, e)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(null);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img 
                src={lightboxImage} 
                alt="Proof Image" 
                className="w-full max-h-[80vh] object-contain rounded-md shadow-2xl bg-black/20" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

