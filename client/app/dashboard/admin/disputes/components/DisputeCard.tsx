import { computeDisputePriority } from "@/lib/disputes/priorityScore";

export interface Dispute {
  id: string;
  disputeNumber: string;
  productTitle: string;
  productCategory: string;
  productFileType: string;
  buyer: { name: string; email: string };
  seller: { name: string; email: string };
  reason: string;
  refundAmount: number;
  originalPrice: number;
  status: 'open' | 'under_review' | 'resolved' | 'rejected' | 'reopened';
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
  history: { timestamp: string; action: string; by?: string; note?: string }[];
}

interface DisputeCardProps {
  dispute: Dispute;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export default function DisputeCard({ dispute, onApprove, onReject, onViewDetails }: DisputeCardProps) {
  const priority = computeDisputePriority(dispute.refundAmount, dispute.createdAt);

  const priorityColors = {
    high: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    medium: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    low: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  };

  const statusColors = {
    open: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    under_review: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    resolved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
    reopened: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };

  const fmt = (n: number) => `₹${Number(n).toFixed(2)}`;

  return (
    <div className="group bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 hover:shadow-md transition-all flex flex-col gap-5">
      
      {/* Header Area */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
              {dispute.disputeNumber}
            </span>
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${statusColors[dispute.status] || "bg-slate-100 text-slate-500"}`}>
              {dispute.status === 'resolved' ? 'refund_approved' : dispute.status.replace("_", " ")}
            </span>
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${priorityColors[priority]}`}>
              {priority} Priority
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {dispute.productTitle} 
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
              {dispute.productCategory} • {dispute.productFileType}
            </span>
          </h3>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
            {fmt(dispute.refundAmount)}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {new Date(dispute.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
        
        {/* Buyer Info */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase shrink-0">
            {dispute.buyer.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Buyer</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{dispute.buyer.name}</p>
            <p className="text-xs text-slate-500 truncate">{dispute.buyer.email}</p>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase shrink-0">
            {dispute.seller.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Seller</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{dispute.seller.name}</p>
            <p className="text-xs text-slate-500 truncate">{dispute.seller.email}</p>
          </div>
        </div>
      </div>

      {/* Reason Block */}
      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dispute Reason</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          "{dispute.reason}"
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2 mt-1">
        <button
          onClick={() => onViewDetails(dispute.id)}
          className="flex-1 sm:flex-none text-center px-2 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          Details
        </button>
        
        {(dispute.status === 'open' || dispute.status === 'reopened') && (
          <>
            <button
              onClick={() => onReject(dispute.id)}
              className="flex-1 sm:flex-none text-center px-2 sm:px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(dispute.id)}
              className="flex-1 sm:flex-none text-center px-2 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              Approve
            </button>
          </>
        )}
      </div>

    </div>
  );
}
