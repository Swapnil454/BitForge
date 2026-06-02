"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  ChevronLeft, FileText, Search, ExternalLink, ShieldAlert, Clock, 
  CheckCircle2, XCircle, Plus, X, Lock, CreditCard, User, AlertTriangle, HelpCircle 
} from "lucide-react";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface Report {
  _id: string;
  reportId?: string;
  issueType: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  proofUrls: string[];
  createdAt: string;
  adminNotes?: string;
  actionHistory?: Array<{
    status: string;
    adminNotes?: string;
    reviewedAt: string;
  }>;
}

const ISSUE_TYPES = [
  { id: "wrongful_ban", label: "Account Suspended", icon: Lock },
  { id: "account_restricted", label: "Account Restricted", icon: ShieldAlert },
  { id: "payment_issue", label: "Payment Issue", icon: CreditCard },
  { id: "login_issue", label: "Login / Access", icon: User },
  { id: "technical_issue", label: "Technical Bug", icon: AlertTriangle },
  { id: "data_privacy", label: "Data Privacy", icon: ShieldAlert },
  { id: "other", label: "Other Inquiry", icon: HelpCircle }
];

export default function MyReportsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const cacheKey = "buyer_reports_cache";
      if (!sessionStorage.getItem(cacheKey)) {
        setLoading(true);
      } else {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) setReports(JSON.parse(cached));
        } catch (e) {}
      }
      
      const res = await reportAPI.getMyReports({ limit: 50 });
      setReports(res.reports);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(res.reports));
      } catch (e) {}
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load your reports");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.issueType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.reportId && r.reportId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === "All") return matchesSearch;
    if (filterStatus === "Pending" && r.status === "pending") return matchesSearch;
    if (filterStatus === "Under Review" && r.status === "under_review") return matchesSearch;
    if (filterStatus === "Resolved" && r.status === "resolved") return matchesSearch;
    if (filterStatus === "Dismissed" && r.status === "dismissed") return matchesSearch;
    return false;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved": 
        return { 
          bg: "bg-green-500/10 dark:bg-[#22c55e]/10", 
          text: "text-green-800 dark:text-[#22c55e]", 
          border: "border-green-500 dark:border-[#22c55e]", 
          icon: CheckCircle2, 
          label: "Resolved",
          hex: "#22c55e"
        };
      case "under_review": 
        return { 
          bg: "bg-blue-500/10 dark:bg-[#3b82f6]/10", 
          text: "text-blue-800 dark:text-[#3b82f6]", 
          border: "border-blue-500 dark:border-[#3b82f6]", 
          icon: Search, 
          label: "Under Investigation",
          hex: "#3b82f6"
        };
      case "dismissed": 
        return { 
          bg: "bg-red-500/10 dark:bg-[#ef4444]/10", 
          text: "text-red-800 dark:text-[#ef4444]", 
          border: "border-red-500 dark:border-[#ef4444]", 
          icon: XCircle, 
          label: "Rejected",
          hex: "#ef4444"
        };
      default: 
        return { 
          bg: "bg-amber-500/10 dark:bg-[#fbbf24]/10", 
          text: "text-amber-800 dark:text-[#fbbf24]", 
          border: "border-amber-500 dark:border-[#fbbf24]", 
          icon: Clock, 
          label: "Pending Review",
          hex: "#fbbf24"
        };
    }
  };

  const getIssueConfig = (typeId: string) => {
    return ISSUE_TYPES.find(t => t.id === typeId) || ISSUE_TYPES[ISSUE_TYPES.length - 1];
  };

  const handleCardClick = (report: Report) => {
    setSelectedReport(report);
    if (isMobile) setIsMobileDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] dark:bg-[#05050a] text-slate-900 dark:text-white overflow-hidden">
      
      {/* Top Navbar */}
      <div className="shrink-0 h-16 bg-white/70 dark:bg-[#1A1A1F]/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard/buyer")}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-[15px] sm:text-base leading-tight">My Reports</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
              {reports.length}
            </span>
          </div>
        </div>
        <button 
          onClick={() => router.push("/report")}
          className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Report</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel - List */}
        <div className={`w-full md:w-[320px] shrink-0 flex flex-col border-r border-slate-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-transparent ${!isMobile || !isMobileDrawerOpen ? 'block' : 'hidden md:flex'}`}>
          
          <div className="p-4 border-b border-slate-200 dark:border-white/5 space-y-4 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            
            <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar custom-scrollbar">
              {["All", "Pending", "Under Review", "Resolved", "Dismissed"].map(filter => {
                const count = filter === "All" ? reports.length :
                              filter === "Pending" ? reports.filter(r => r.status === 'pending').length :
                              filter === "Under Review" ? reports.filter(r => r.status === 'under_review').length :
                              filter === "Resolved" ? reports.filter(r => r.status === 'resolved').length :
                              reports.filter(r => r.status === 'dismissed').length;

                return (
                  <button
                    key={filter}
                    onClick={() => setFilterStatus(filter)}
                    className={`shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                      filterStatus === filter 
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600' 
                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                    }`}
                  >
                    {filter}
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${filterStatus === filter ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                No reports found
              </div>
            ) : (
              filteredReports.map(report => {
                const isSelected = selectedReport?._id === report._id;
                const status = getStatusConfig(report.status);
                const issue = getIssueConfig(report.issueType);
                const IssueIcon = issue.icon;

                return (
                  <button
                    key={report._id}
                    onClick={() => handleCardClick(report)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                      isSelected 
                        ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/30 shadow-sm' 
                        : 'bg-white dark:bg-[#1A1A1F] border-slate-200 dark:border-white/5 hover:-translate-y-[2px] hover:shadow-md'
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600" />}
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                          <IssueIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">
                          {issue.label}
                        </span>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: status.hex }} title={status.label} />
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed pr-2">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      <span>{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>{report.reportId || report._id.slice(-6).toUpperCase()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Detail View */}
        <div 
          className={`flex-1 bg-white dark:bg-[#0A0A0F] relative overflow-hidden transition-transform duration-300 ${
            isMobile 
              ? (isMobileDrawerOpen ? 'fixed inset-0 z-50 flex flex-col translate-y-0' : 'fixed inset-0 z-50 flex flex-col translate-y-full') 
              : 'flex flex-col'
          }`}
        >
          {isMobile && (
            <div className="shrink-0 p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#0A0A0F]">
              <span className="font-semibold text-sm">Report Details</span>
              <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedReport ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
              <div className="max-w-3xl mx-auto space-y-8 pb-12">
                
                {/* Status Banner */}
                {(() => {
                  const status = getStatusConfig(selectedReport.status);
                  const StatusIcon = status.icon;
                  return (
                    <div className={`p-5 rounded-2xl border flex items-start gap-4 ${status.bg} border-[${status.hex}]/30`}>
                      <div className="shrink-0 mt-0.5">
                        <StatusIcon className={`w-6 h-6`} style={{ color: status.hex }} />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg mb-1" style={{ color: status.hex }}>{status.label}</h2>
                        <p className={`text-sm ${status.text} opacity-90`}>
                          {selectedReport.status === 'pending' && "We've received your report. Our Trust & Safety team will review it shortly."}
                          {selectedReport.status === 'under_review' && "Our team is actively investigating this issue and may take action soon."}
                          {selectedReport.status === 'resolved' && "Action has been taken based on your report. Thank you for helping keep our community safe."}
                          {selectedReport.status === 'dismissed' && "After review, we determined no policy violation occurred or insufficient evidence was provided."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Timeline Stepper */}
                <div className="px-2">
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-200 dark:before:bg-white/10">
                    
                    {/* Step 1: Submitted */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 border-4 border-white dark:border-[#0A0A0F] shadow-sm shrink-0 z-10" />
                      <div className="pt-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Submitted</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(selectedReport.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Under Review */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-4 border-white dark:border-[#0A0A0F] shadow-sm shrink-0 z-10 ${
                        ['under_review', 'resolved', 'dismissed'].includes(selectedReport.status) 
                          ? 'bg-blue-500' 
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="pt-0.5">
                        <p className={`text-sm font-bold ${['under_review', 'resolved', 'dismissed'].includes(selectedReport.status) ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Under Review</p>
                        {selectedReport.actionHistory?.find(h => h.status === 'under_review') ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(selectedReport.actionHistory.find(h => h.status === 'under_review')!.reviewedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">Pending</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Resolution */}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-4 border-white dark:border-[#0A0A0F] shadow-sm shrink-0 z-10 ${
                        selectedReport.status === 'resolved' ? 'bg-green-500' :
                        selectedReport.status === 'dismissed' ? 'bg-red-500' :
                        'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className="pt-0.5">
                        <p className={`text-sm font-bold ${['resolved', 'dismissed'].includes(selectedReport.status) ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {selectedReport.status === 'resolved' ? 'Resolved' : selectedReport.status === 'dismissed' ? 'Rejected' : 'Resolution'}
                        </p>
                        {['resolved', 'dismissed'].includes(selectedReport.status) ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(selectedReport.actionHistory?.find(h => h.status === selectedReport.status)?.reviewedAt || selectedReport.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">Pending</p>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-white/10" />

                {/* Report Details Grid */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">Report Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Issue Type</p>
                      <p className="text-sm font-semibold">{getIssueConfig(selectedReport.issueType).label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Submitted On</p>
                      <p className="text-sm font-semibold">{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Reference #</p>
                      <p className="text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">{selectedReport.reportId || selectedReport._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Attachments</p>
                      <p className="text-sm font-semibold">{selectedReport.proofUrls?.length || 0} file(s)</p>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] dark:bg-white/5 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Description</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {/* Proofs Grid */}
                {selectedReport.proofUrls && selectedReport.proofUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Attached Files</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedReport.proofUrls.map((proof, i) => {
                        const isImage = proof.match(/\.(jpeg|jpg|gif|png|webp)$/i) || proof.includes('res.cloudinary.com/image');
                        const isPdf = proof.match(/\.pdf$/i) || proof.includes('.pdf');

                        return (
                          <button 
                            key={i} 
                            onClick={() => setSelectedProof(proof)}
                            className="group relative w-24 h-24 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-black/50 flex items-center justify-center shrink-0"
                          >
                            {isImage ? (
                              <img src={proof} alt={`Attachment ${i+1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <FileText className={`w-8 h-8 ${isPdf ? 'text-rose-500' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-semibold text-slate-500">{isPdf ? 'PDF' : 'FILE'}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Admin Response Box */}
                {selectedReport.adminNotes && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 md:p-6 mt-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                        <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Trust & Safety Team</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Admin</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedReport.adminNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
                <FileText className="w-10 h-10 text-slate-300 dark:text-white/20" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Report Selected</h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 max-w-xs">
                Select a report from the list to view its status, timeline, and details.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#F8FAFC] dark:bg-[#0A0A0F] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Attachment Viewer
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const downloadUrl = selectedProof.includes('cloudinary') ? selectedProof.replace('/upload/', '/upload/fl_attachment/') : selectedProof;
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    const fileName = selectedProof.split('/').pop()?.split('?')[0] || 'attachment';
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Download
                </button>
                <button 
                  onClick={() => setSelectedProof(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-black/30 flex items-center justify-center p-4">
              {selectedProof.match(/\.(jpeg|jpg|gif|png|webp)$/i) || selectedProof.includes('res.cloudinary.com/image') ? (
                <img src={selectedProof} alt="Attachment" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
              ) : selectedProof.match(/\.pdf$/i) || selectedProof.includes('.pdf') ? (
                <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedProof)}&embedded=true`} className="w-full h-[70vh] rounded-lg bg-white border-0" title="Attachment" />
              ) : (
                <iframe src={selectedProof} className="w-full h-[70vh] rounded-lg bg-white border-0" title="Attachment" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
