"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface AreaMetricChartProps<T> {
  data: T[];
  dataKey: keyof T;
  height?: number;
  gradientId?: string;
  strokeColor?: string;
  emptyIcon?: string;
  emptyText?: string;
}

export function AreaMetricChart<T extends { month: string }>({
  data,
  dataKey,
  height = 160,
  gradientId = "areaGradient",
  strokeColor = "#06b6d4",
  emptyIcon = "📉",
  emptyText = "No data to display",
}: AreaMetricChartProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const displayData = isMobile ? data.slice(-4) : data.slice(-6);

  const hasData =
    Array.isArray(displayData) &&
    displayData.length > 0 &&
    displayData.some((d) => Number(d[dataKey]) > 0);

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center text-cyan-300/70 text-xs md:text-sm select-none"
      >
        <span className="text-2xl mb-1">{emptyIcon}</span>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ height }} className="focus:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_*]:focus:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fill: "#67e8f9", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              boxShadow: "0 4px 24px #06b6d4aa",
            }}
            cursor={{ fill: "#38bdf822" }}
          />
          <Area
            type="monotone"
            dataKey={dataKey as string}
            stroke={strokeColor}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: strokeColor, stroke: "#fff", strokeWidth: 1 }}
            activeDot={{ stroke: 'none' }}
            isAnimationActive
            animationDuration={900}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.7} />
              <stop offset="80%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0.01} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
