"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ShieldAlert, AlertTriangle, ExternalLink, CheckCircle2, RefreshCw, XCircle, FileWarning, Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { ScanReportPayload } from "@/lib/types/security";
import toast from "react-hot-toast";

function ReportSkeleton() {
  return (
    <div className="p-8 animate-pulse space-y-8">
      <div className="h-10 w-64 bg-slate-200 dark:bg-white/10 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-slate-200 dark:bg-white/10 rounded-2xl md:col-span-2" />
        <div className="h-40 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
      <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-2xl" />
    </div>
  );
}

export default function ScanReportPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: scan, isLoading, isError } = useQuery<ScanReportPayload>({
    queryKey: ["malwareScan", id],
    queryFn: () => adminAPI.getMalwareScanDetails(id),
    refetchInterval: (query) => 
      query.state.data?.scanStatus === 'SCANNING' ? 3000 : false
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type }: { type: 'whitelist' | 'notify' | 'remove' | 'rescan' }) => {
      switch (type) {
        case 'whitelist': return adminAPI.whitelistMalwareScan(id);
        case 'notify': return adminAPI.notifySellerThreat(id);
        case 'remove': return adminAPI.takedownMaliciousProduct(id);
        case 'rescan': return adminAPI.rescanMalware(id);
      }
    },
    onMutate: async ({ type }) => {
      await queryClient.cancelQueries({ queryKey: ['malwareScan', id] });
      const snapshot = queryClient.getQueryData<ScanReportPayload>(['malwareScan', id]);
      
      queryClient.setQueryData<ScanReportPayload | undefined>(['malwareScan', id], (old) => {
        if (!old) return old;
        const optimistic = { ...old };
        if (type === 'whitelist' || type === 'remove') optimistic.scanStatus = 'MANUALLY_REVIEWED';
        if (type === 'rescan') optimistic.scanStatus = 'SCANNING';
        if (type === 'notify') optimistic.sellerNotifiedAt = new Date().toISOString();
        return optimistic;
      });
      
      return { snapshot };
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(['malwareScan', id], context?.snapshot);
      toast.error(err?.response?.data?.message || `Action failed: ${err.message}`);
    },
    onSuccess: (_, { type }) => {
      if (type === 'whitelist') toast.success("Scan whitelisted");
      if (type === 'notify') toast.success("Seller notified");
      if (type === 'remove') toast.success("Product removed");
      if (type === 'rescan') toast.success("Re-scan initiated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['malwareScan', id] });
      queryClient.invalidateQueries({ queryKey: ['malwareScans'] }); // Update the list too
    }
  });

  if (isLoading) return <ReportSkeleton />;
  if (isError || !scan) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Failed to load report</h2>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-lg font-bold">Go Back</button>
      </div>
    );
  }

  // Data Freshness Check
  const isStale = scan.malwareScanDate 
    ? (new Date().getTime() - new Date(scan.malwareScanDate).getTime()) > (24 * 60 * 60 * 1000)
    : true;

  const isMalicious = scan.scanStatus === "MALICIOUS" || scan.scanStatus === "FLAGGED";
  const isScanning = scan.scanStatus === "SCANNING";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/admin/security" className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 inline-block">
            ← Back to Security Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Threat Intelligence Report</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed analysis for product: <span className="font-bold text-slate-700 dark:text-white/80">{scan.title}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          {isScanning ? (
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> SCANNING
            </span>
          ) : (
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
              isMalicious ? "bg-red-500/10 text-red-500 border-red-500/20" : 
              scan.scanStatus === "CLEAN" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
              "bg-amber-500/10 text-amber-500 border-amber-500/20"
            }`}>
              {scan.scanStatus.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {isStale && !isScanning && scan.scanStatus !== 'PENDING' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Stale Threat Data</p>
            <p className="opacity-90">This scan is older than 24 hours. Consider re-scanning the file to ensure no new zero-day signatures match it.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-slate-400" /> Analysis Results
            </h2>
            
            {scan.malwareScanDetails ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Malicious</p>
                  <p className="text-3xl font-black text-red-500">{scan.malwareScanDetails.malicious_count}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Suspicious</p>
                  <p className="text-3xl font-black text-amber-500">{scan.malwareScanDetails.suspicious_count}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Undetected</p>
                  <p className="text-3xl font-black text-slate-600 dark:text-white/60">{scan.malwareScanDetails.undetected_count}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Engines Used</p>
                  <p className="text-3xl font-black text-indigo-500">{scan.malwareScanDetails.total_engines || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/[0.05]">
                {isScanning ? "Scan currently in progress. Please wait..." : "No detailed scan metrics available."}
              </div>
            )}
            
            {scan.virusTotalLink && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/[0.05]">
                <a href={scan.virusTotalLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors rounded-lg text-sm font-bold">
                  <ExternalLink className="w-4 h-4" /> View Full VirusTotal Report
                </a>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-slate-400" /> Seller Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/[0.02]">
                <span className="text-sm text-slate-500">Name</span>
                <span className="text-sm font-bold">{scan.sellerId.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/[0.02]">
                <span className="text-sm text-slate-500">Email</span>
                <span className="text-sm font-bold">{scan.sellerId.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Action Rail */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#13131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
            {isScanning && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                  <Loader2 className="w-5 h-5 animate-spin" /> Scanning...
                </div>
              </div>
            )}
            
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">Admin Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => actionMutation.mutate({ type: 'remove' })}
                disabled={actionMutation.isPending}
                className="w-full flex justify-between items-center px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors font-bold text-sm disabled:opacity-50">
                <span className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Remove Product</span>
              </button>
              
              <button 
                onClick={() => actionMutation.mutate({ type: 'notify' })}
                disabled={!!scan.sellerNotifiedAt || actionMutation.isPending} 
                className="w-full flex justify-between items-center px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="flex items-center gap-2"><FileWarning className="w-4 h-4" /> {scan.sellerNotifiedAt ? "Seller Notified" : "Notify Seller"}</span>
              </button>

              <button 
                onClick={() => actionMutation.mutate({ type: 'whitelist' })}
                disabled={actionMutation.isPending}
                className="w-full flex justify-between items-center px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors font-bold text-sm disabled:opacity-50">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark as Clean</span>
              </button>
              
              <div className="my-4 border-t border-slate-100 dark:border-white/[0.05]" />

              <button 
                onClick={() => actionMutation.mutate({ type: 'rescan' })}
                disabled={actionMutation.isPending}
                className="w-full flex justify-between items-center px-4 py-3 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white rounded-xl transition-colors font-bold text-sm disabled:opacity-50">
                <span className="flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${actionMutation.isPending && actionMutation.variables?.type === 'rescan' ? 'animate-spin' : ''}`} /> Force Re-scan</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center">Actions are tracked in the moderation audit log.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
