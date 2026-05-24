import { Users, UserCheck, UserX, IndianRupee } from "lucide-react";

interface SummaryData {
  totalBuyers: number;
  verifiedBuyers: number;
  unverifiedBuyers: number;
  totalSellers?: number;
  verifiedSellers?: number;
  unverifiedSellers?: number;
  totalUsersForRole?: number;
  verifiedUsersForRole?: number;
  unverifiedUsersForRole?: number;
  totalValueForRole?: number;
  platformTotalSpent: number;
}

export default function UserSummaryPanel({
  data,
  role = "buyer",
}: {
  data: SummaryData;
  role?: "all" | "buyer" | "seller";
}) {
  if (role === "all") {
    const totalUsers = (data.totalBuyers || 0) + (data.totalSellers || 0);
    const totalVerified = (data.verifiedBuyers || 0) + (data.verifiedSellers || 0);

    const metrics = [
      {
        label: "Total Users",
        value: totalUsers.toLocaleString(),
        icon: <Users className="w-4 h-4 text-slate-500 dark:text-white/40" />,
      },
      {
        label: "Total Buyers",
        value: (data.totalBuyers || 0).toLocaleString(),
        icon: <Users className="w-4 h-4 text-cyan-500" />,
      },
      {
        label: "Total Sellers",
        value: (data.totalSellers || 0).toLocaleString(),
        icon: <Users className="w-4 h-4 text-violet-500" />,
      },
      {
        label: "Verified Accounts",
        value: totalVerified.toLocaleString(),
        icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
      },
    ];

    return (
      <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-3 sm:p-5 shadow-sm overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-4 sm:gap-10 min-w-max">
          {metrics.map((metric, i) => (
            <div key={metric.label} className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                  {metric.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">{metric.label}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{metric.value}</span>
                </div>
              </div>
              {i < metrics.length - 1 && (
                <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const entityLabel = role === "seller" ? "Sellers" : "Buyers";
  const totalUsers = data.totalUsersForRole ?? (role === "seller" ? data.totalSellers : data.totalBuyers) ?? 0;
  const verifiedUsers =
    data.verifiedUsersForRole ?? (role === "seller" ? data.verifiedSellers : data.verifiedBuyers) ?? 0;
  const unverifiedUsers =
    data.unverifiedUsersForRole ?? (role === "seller" ? data.unverifiedSellers : data.unverifiedBuyers) ?? 0;
  const roleValue = data.totalValueForRole ?? data.platformTotalSpent ?? 0;

  const metrics = [
    {
      label: `Total ${entityLabel}`,
      value: totalUsers.toLocaleString(),
      icon: <Users className="w-4 h-4 text-slate-500 dark:text-white/40" />,
    },
    {
      label: "Verified",
      value: verifiedUsers.toLocaleString(),
      icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
    },
    {
      label: "Unverified",
      value: unverifiedUsers.toLocaleString(),
      icon: <UserX className="w-4 h-4 text-amber-500" />,
    },
    {
      label: role === "seller" ? "Total Earning" : "Total Spent",
      value: `₹${roleValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: <IndianRupee className="w-4 h-4 text-slate-500 dark:text-white/40" />,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#16161e] border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-3 sm:p-5 shadow-sm overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-4 sm:gap-10 min-w-max">
        {metrics.map((metric, i) => (
          <div key={metric.label} className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                {metric.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">{metric.label}</span>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">{metric.value}</span>
              </div>
            </div>
            {i < metrics.length - 1 && (
              <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
