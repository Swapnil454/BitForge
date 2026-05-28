import { useRouter } from "next/navigation";

export interface Dispute {
  id: string;
  orderId: string | null;
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

interface BuyerDisputeCardProps {
  dispute: Dispute;
}

export default function BuyerDisputeCard({ dispute }: BuyerDisputeCardProps) {
  const router = useRouter();

  // Priority logic removed as it was admin specific
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
      <div className="flex flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
            {dispute.disputeNumber}
          </span>
          <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${statusColors[dispute.status] || "bg-slate-100 text-slate-500"}`}>
            {dispute.status === 'resolved' ? 'refund_approved' : dispute.status.replace("_", " ")}
          </span>
        </div>
        
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
          {dispute.productTitle} 
          <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
            {dispute.productCategory}
            {dispute.productFileType && dispute.productFileType !== 'Unknown' && dispute.productFileType !== 'undefined' ? ` • ${dispute.productFileType}` : ''}
          </span>
        </h3>

        <div className="flex justify-between items-center mt-2">
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
            {fmt(dispute.refundAmount)}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
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

      {/* Admin Note Block if exists */}
      {dispute.adminNote && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">Admin Note</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
            "{dispute.adminNote}"
          </p>
        </div>
      )}

      {/* Footer Actions */}
      {dispute.orderId && (
        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2 mt-1">
          <button
            onClick={() => router.push(`/dashboard/buyer/purchases/${dispute.orderId}`)}
            className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            View Order
          </button>
        </div>
      )}

    </div>
  );
}
