"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, FileText, Search, ExternalLink, MessageCircleWarning, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "@/app/dashboard/buyer/transactions/components/PageHeader";

interface Report {
  _id: string;
  issueType: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  proofs: string[];
  createdAt: string;
  adminNotes?: string;
  actionHistory?: Array<{
    status: string;
    adminNotes?: string;
    reviewedAt: string;
  }>;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getMyReports({ limit: 50 });
      setReports(res.reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.issueType.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved": return { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle2, label: "Resolved" };
      case "under_review": return { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Search, label: "Under Review" };
      case "dismissed": return { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", icon: ShieldAlert, label: "Dismissed" };
      default: return { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Clock, label: "Pending Review" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white">
      <PageHeader 
        title="My Reports"
        subtitle="Track the status of your submitted reports"
        backHref="/report"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div /> {/* Spacer for flex-between since title is now in PageHeader */}
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-300 dark:text-white/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-linear-to-b from-indigo-500/5 to-transparent rounded-3xl border border-indigo-500/10 text-center"
          >
            <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
              <FileText className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Reports Found</h3>
            <p className="text-slate-500 dark:text-white/60 max-w-sm mb-6">
              You haven't submitted any reports yet, or none match your search.
            </p>
            <button
              onClick={() => router.push("/report")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30"
            >
              Submit a Report
            </button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredReports.map((report) => {
                const isSelected = selectedReport?._id === report._id;
                const status = getStatusConfig(report.status);
                const StatusIcon = status.icon;

                return (
                  <motion.button
                    key={report._id}
                    onClick={() => setSelectedReport(report)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-2">
                        {report.issueType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border} shrink-0`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-white/50 line-clamp-2 mb-3">
                      {report.description}
                    </p>
                    <div className="text-xs text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      {report.proofs?.length > 0 && (
                        <span className="flex items-center gap-1 text-indigo-300">
                          <ExternalLink className="h-3 w-3" /> {report.proofs.length} proof(s)
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedReport ? (
                  <motion.div
                    key={selectedReport._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8"
                  >
                    {/* Status Header */}
                    {(() => {
                      const status = getStatusConfig(selectedReport.status);
                      const StatusIcon = status.icon;
                      return (
                        <div className={`p-4 rounded-2xl border mb-8 flex items-start gap-4 ${status.bg} ${status.border}`}>
                          <div className={`p-2 rounded-xl bg-white dark:bg-black/20 shrink-0`}>
                            <StatusIcon className={`h-6 w-6 ${status.color}`} />
                          </div>
                          <div>
                            <h3 className={`font-bold ${status.color} mb-1`}>Status: {status.label}</h3>
                            <p className="text-slate-600 dark:text-white/70 text-sm">
                              {selectedReport.status === 'pending' && "We've received your report and our Trust & Safety team will review it shortly."}
                              {selectedReport.status === 'under_review' && "Our team is actively investigating this issue and may take action soon."}
                              {selectedReport.status === 'resolved' && "Action has been taken based on your report. Thank you for helping keep our community safe."}
                              {selectedReport.status === 'dismissed' && "After review, we determined no policy violation occurred or insufficient evidence was provided."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Admin Notes */}
                    {selectedReport.adminNotes && (
                      <div className="mb-8 p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex gap-4">
                        <MessageCircleWarning className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">Admin Response</p>
                          <p className="text-slate-800 dark:text-white/90 text-sm leading-relaxed">{selectedReport.adminNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Report Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 dark:text-white/50 mb-2">Issue Type</h4>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedReport.issueType}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-400 dark:text-white/50 mb-2">Description</h4>
                        <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-700 dark:text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedReport.description}
                        </div>
                      </div>

                      {/* Proofs */}
                      {selectedReport.proofs && selectedReport.proofs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 dark:text-white/50 mb-3">Attached Proofs</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedReport.proofs.map((proof, index) => (
                              <a
                                key={index}
                                href={proof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-video bg-white dark:bg-black/50 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-colors block"
                              >
                                <img 
                                  src={proof} 
                                  alt={`Proof ${index + 1}`} 
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-white dark:bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ExternalLink className="text-slate-900 dark:text-white h-6 w-6" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Action History Timeline */}
                      {selectedReport.actionHistory && selectedReport.actionHistory.length > 0 && (
                        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                          <h4 className="text-sm font-medium text-slate-400 dark:text-white/50 mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" /> Resolution Timeline
                          </h4>
                          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                            
                            {/* Initial Submission (Virtual Node) */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0a0a0f] bg-indigo-500/20 text-indigo-400 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">Report Submitted</div>
                                  <div className="text-xs text-slate-400 dark:text-white/40">{new Date(selectedReport.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-white/70">You submitted the report.</div>
                              </div>
                            </div>

                            {/* Actual History Nodes */}
                            {selectedReport.actionHistory.map((history, idx) => {
                              const histStatus = getStatusConfig(history.status);
                              return (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0a0a0f] ${histStatus.bg} ${histStatus.color} shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                    <histStatus.icon className="w-4 h-4" />
                                  </div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className={`font-bold ${histStatus.color} text-sm`}>Status: {histStatus.label}</div>
                                      <div className="text-xs text-slate-400 dark:text-white/40">{new Date(history.reviewedAt).toLocaleString()}</div>
                                    </div>
                                    {history.adminNotes && (
                                      <div className="mt-2 text-sm text-slate-600 dark:text-white/70 bg-white dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                        <p className="text-xs text-slate-400 dark:text-white/40 mb-1 uppercase tracking-wider font-semibold">Admin Note</p>
                                        {history.adminNotes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between text-xs text-slate-400 dark:text-white/40">
                        <span>Report ID: {selectedReport._id}</span>
                        <span>Submitted on {new Date(selectedReport.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center bg-slate-900/20 border border-slate-200 dark:border-white/5 rounded-3xl border-dashed">
                    <FileText className="h-10 w-10 text-white/10 mb-4" />
                    <p className="text-slate-400 dark:text-white/40">Select a report from the list to view details</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
