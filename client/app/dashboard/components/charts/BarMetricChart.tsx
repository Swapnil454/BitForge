
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface BarMetricChartProps<T> {
  data: T[];
  dataKey: keyof T;
  height?: number;
  gradientId?: string;
  barColor?: string;
  emptyIcon?: string;
  emptyText?: string;
}

export function BarMetricChart<T extends { month: string }>({
  data,
  dataKey,
  height = 160,
  gradientId = "barGradient",
  barColor = "#6366f1",
  emptyIcon = "📊",
  emptyText = "No data to display",
}: BarMetricChartProps<T>) {
  const hasData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some((d) => Number(d[dataKey]) > 0);

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center text-indigo-300/70 text-xs md:text-sm select-none"
      >
        <span className="text-2xl mb-1">{emptyIcon}</span>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: "#a5b4fc", fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              boxShadow: "0 4px 24px #6366f1aa",
            }}
            cursor={{ fill: "#6366f122" }}
          />
          <Bar
            dataKey={dataKey as string}
            fill={`url(#${gradientId})`}
            radius={[8, 8, 0, 0]}
            isAnimationActive
            animationDuration={900}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.8} />
              <stop offset="80%" stopColor={barColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0.01} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
