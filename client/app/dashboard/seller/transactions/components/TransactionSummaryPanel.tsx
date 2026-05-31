import { BarChart2, CheckCircle2, Clock, XCircle } from "lucide-react";

interface TransactionSummaryProps {
  totalVolume: number;
  totalCount: number;
  successful: { amount: number; count: number };
  pending: { amount: number; count: number };
  failed: { amount: number; count: number };
  dateLabel: string;
}

export default function TransactionSummaryPanel({
  totalVolume,
  totalCount,
  successful,
  pending,
  failed,
  dateLabel,
}: TransactionSummaryProps) {
  const formatAmount = (amount: number): string =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const getPercent = (amount: number) => {
    return totalVolume > 0 ? (amount / totalVolume) * 100 : 0;
  };

  const rows = [
    {
      id: "total",
      label: "Total volume",
      icon: <BarChart2 className="w-4 h-4 text-slate-500 dark:text-white/50" />,
      amount: totalVolume,
      count: totalCount,
      accentColor: "bg-slate-400 dark:bg-slate-600",
      progressColor: "bg-slate-300 dark:bg-slate-600",
      progressWidth: 100,
    },
    {
      id: "success",
      label: "Successful",
      icon: <CheckCircle2 className="w-4 h-4 text-[#639922]" />,
      amount: successful.amount,
      count: successful.count,
      accentColor: "bg-[#639922]",
      progressColor: "bg-[#639922]",
      progressWidth: getPercent(successful.amount),
    },
    {
      id: "pending",
      label: "Pending",
      icon: <Clock className="w-4 h-4 text-[#EF9F27]" />,
      amount: pending.amount,
      count: pending.count,
      accentColor: "bg-[#EF9F27]",
      progressColor: "bg-[#EF9F27]",
      progressWidth: getPercent(pending.amount),
    },
    {
      id: "failed",
      label: "Failed",
      icon: <XCircle className="w-4 h-4 text-[#E24B4A]" />,
      amount: failed.amount,
      count: failed.count,
      accentColor: "bg-[#E24B4A]",
      progressColor: "bg-[#E24B4A]",
      progressWidth: getPercent(failed.amount),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111116] overflow-hidden shadow-sm mb-6">
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-300 dark:border-slate-700">
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Payment breakdown</h3>
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {dateLabel} · {totalCount} transactions
        </p>
      </div>
      {/* DESKTOP VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
          <colgroup>
            <col className="w-[3px]" />
            <col className="w-auto" />
            <col className="w-[200px]" />
            <col className="w-[120px]" />
            <col className="w-[80px]" />
          </colgroup>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`group hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${
                  index !== rows.length - 1 ? "border-b border-slate-200 dark:border-slate-800" : ""
                }`}
              >
                <td className={`p-0 h-full ${row.accentColor}`} />
                <td className="py-[12px] px-5">
                  <div className="flex items-center gap-3">
                    {row.icon}
                    <span className="text-[13px] font-medium text-slate-900 dark:text-slate-200">
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="py-[12px] px-5">
                  <div className="w-full min-w-[140px] h-[6px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${row.progressColor}`}
                      style={{ width: `${Math.max(row.progressWidth, row.amount > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </td>
                <td className="py-[12px] px-5 text-right font-mono text-[13px] font-medium text-slate-900 dark:text-slate-200">
                  {formatAmount(row.amount)}
                </td>
                <td className="py-[12px] pl-2 pr-5 text-right text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {row.count} txn
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="block sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {rows.map((row) => (
          <div key={row.id} className="p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${row.accentColor}`} />
            <div className="flex justify-between items-center pl-2">
              <div className="flex items-center gap-2">
                {row.icon}
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{row.label}</span>
              </div>
              <span className="font-mono text-[13px] font-medium text-slate-900 dark:text-slate-200">
                {formatAmount(row.amount)}
              </span>
            </div>
            <div className="flex items-center gap-4 pl-2">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${row.progressColor}`}
                  style={{ width: `${Math.max(row.progressWidth, row.amount > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {row.count} txn
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
