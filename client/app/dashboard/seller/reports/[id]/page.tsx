"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, ExternalLink, MessageCircleWarning, Clock, CheckCircle2, ShieldAlert, Activity, Calendar, Info } from "lucide-react";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import PageHeader from "../../../buyer/transactions/components/PageHeader";

interface Report {
  _id: string;
  issueType: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  proofs: string[];
  createdAt: string;
  adminNotes?: string;
}

export default function ReportDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getMyReports({ limit: 100 });
      const foundReport = res.reports.find((r: Report) => r._id === reportId);
      if (foundReport) {
        setReport(foundReport);
      } else {
        toast.error("Report not found");
        router.push("/dashboard/seller/reports");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "resolved": return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2, label: "Resolved" };
      case "investigating":
      case "under_review": return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", icon: Activity, label: "Under Review" };
      case "dismissed": return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20", icon: ShieldAlert, label: "Dismissed" };
      case "pending":
      default: return { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-500/20", icon: Clock, label: "Pending" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] pb-20">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#05050a]/80 border-b border-slate-200 dark:border-white/10 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="w-32 h-6 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm mb-8">
            <div className="w-28 h-8 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse mb-6"></div>
            <div className="w-3/4 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse mb-6"></div>
            <div className="flex gap-4">
              <div className="w-32 h-12 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse"></div>
              <div className="w-32 h-12 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse"></div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
              <div className="w-full h-24 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
            </div>
          </div>

          <div className="w-32 h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse mb-4"></div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <div className="space-y-3">
              <div className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></div>
              <div className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></div>
              <div className="w-2/3 h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!report) return null;

  const status = getStatusConfig(report.status);
  const StatusIcon = status.icon;

  const formatIssueType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-white pb-20 relative">
      {/* Background Accent */}
      <div className="fixed top-0 inset-x-0 h-[400px] bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />

      {/* Top Header */}
      <PageHeader
        backHref="/dashboard/seller/reports"
        backLabel="Back to Reports"
        title="Report Details"
      />

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Title and Status Area */}
        <div className="mb-8">
          <div className="md:bg-white md:dark:bg-white/5 md:border border-slate-200 dark:border-white/10 md:rounded-3xl md:p-8 md:shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-sm font-bold tracking-wide ${status.color} flex items-center gap-2`}>
                <StatusIcon className="w-5 h-5" />
                {status.label}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5">
              {formatIssueType(report.issueType)}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 dark:text-white/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider mb-0.5">Submitted On</p>
                  <p className="text-slate-700 dark:text-white/80 font-semibold">
                    {new Date(report.createdAt).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-white/40" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider mb-0.5">Reference ID</p>
                  <p className="text-slate-700 dark:text-white/80 font-mono font-semibold tracking-tight">
                    {report._id}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5">
              {(() => {
                const steps = [
                  { id: 'pending', label: 'Pending Review', icon: Clock },
                  { id: 'review', label: 'Under Review', icon: Activity },
                  { id: 'decision', label: 'Decision Reached', icon: CheckCircle2 }
                ];
                
                let currentStepIndex = 0;
                if ((report.status as string) === 'investigating' || (report.status as string) === 'under_review') currentStepIndex = 1;
                if (report.status === 'resolved' || report.status === 'dismissed') currentStepIndex = 2;

                return (
                  <div className="w-full">
                    {/* Modern Timeline */}
                    <div className="relative mb-16 px-4 md:px-12">
                      {/* Background Track */}
                      <div className="absolute top-5 md:top-6 left-[10%] right-[10%] h-[3px] md:h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        {/* Animated Progress Line */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>

                      <div className="relative flex justify-between">
                        {steps.map((step, index) => {
                          const isCompleted = index < currentStepIndex;
                          const isActive = index === currentStepIndex;
                          const StepIcon = index === 2 && report.status === 'dismissed' ? ShieldAlert : step.icon;
                          
                          let circleStyle = "bg-white dark:bg-[#05050a] border-2 border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20";
                          let labelStyle = "text-slate-400 dark:text-white/40";
                          
                          if (isCompleted) {
                            circleStyle = "bg-indigo-500 border-2 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]";
                            labelStyle = "text-slate-700 dark:text-white/80";
                          } else if (isActive) {
                            // Extract color prefix (e.g. 'amber' from 'text-amber-600') to use for ring
                            const colorName = status.color.split('-')[1];
                            circleStyle = `bg-white dark:bg-[#05050a] border-[3px] md:border-4 ${status.border.replace('border-', 'border-')} ${status.color} shadow-lg shadow-black/5 ring-4 ring-${colorName}-50 dark:ring-${colorName}-900/20`;
                            labelStyle = status.color;
                          }

                          return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 w-8 md:w-16">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 ${circleStyle}`}>
                                <StepIcon className="w-4 h-4 md:w-5 md:h-5" />
                              </div>
                              <div className="absolute top-14 w-28 md:w-32 text-center">
                                <p className={`text-[10px] sm:text-[11px] md:text-sm font-bold tracking-wide transition-colors duration-500 leading-tight ${labelStyle}`}>
                                  {index === 2 && report.status === 'dismissed' ? 'Dismissed' : (index === 2 && report.status === 'resolved' ? 'Resolved' : step.label)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inline Status Message */}
                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-row gap-4 items-start">
                      <Info className={`w-6 h-6 md:w-7 md:h-7 ${status.color} shrink-0 mt-0.5`} />
                      <div>
                        <h4 className={`text-base md:text-lg font-extrabold ${status.color} mb-1.5 tracking-tight`}>Current Status</h4>
                        <p className="text-slate-600 dark:text-white/70 text-sm md:text-base leading-relaxed">
                          {report.status === 'pending' && "We have received your report. Our Trust & Safety team will review it shortly. You will be notified when an update is available."}
                          {((report.status as string) === 'investigating' || (report.status as string) === 'under_review') && "Our team is actively reviewing your report. We may request additional information if needed."}
                          {report.status === 'resolved' && "Action has been taken based on your report. Thank you for helping keep our community safe."}
                          {report.status === 'dismissed' && "After careful review, we determined no policy violation occurred or insufficient evidence was provided to take action."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {report.adminNotes && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3 pl-1">Official Response</h2>
            <div className="p-6 md:p-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl">
              <div className="flex gap-4">
                <MessageCircleWarning className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-800 dark:text-white/90 text-base leading-relaxed">{report.adminNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3 pl-1">Description of Issue</h2>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
            <p className="text-slate-700 dark:text-white/80 text-base leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </div>
        </div>

        {/* Evidence */}
        {report.proofs && report.proofs.length > 0 && (
          <div className="mb-12 pt-12 border-t border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-6 flex items-center gap-3">
              Attached Evidence 
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-600 dark:text-white/60 text-xs">
                {report.proofs.length} Files
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {report.proofs.map((proof, index) => (
                <a
                  key={index}
                  href={proof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block relative aspect-[4/3] bg-slate-100 dark:bg-black/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300"
                >
                  <img 
                    src={proof} 
                    alt={`Proof ${index + 1}`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <ExternalLink className="h-5 w-5" />
                      View Original
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
