"use client";

import { useState, useEffect } from "react";
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
  onActivePayloadChange?: (payload: T | null) => void;
}

export function BarMetricChart<T extends { month: string }>({
  data,
  dataKey,
  height = 160,
  gradientId = "barGradient",
  barColor = "#6366f1",
  emptyIcon = "",
  emptyText = "No data to display",
  onActivePayloadChange,
}: BarMetricChartProps<T>) {
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
        className="flex flex-col items-center justify-center text-indigo-300/70 text-xs md:text-sm select-none"
      >
        <span className="text-2xl mb-1">{emptyIcon}</span>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ height }} className="focus:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_*]:focus:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={displayData} 
          margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
          onMouseMove={(state: any) => {
            if (state && state.isTooltipActive && state.activePayload && state.activePayload.length) {
              onActivePayloadChange?.(state.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => {
            onActivePayloadChange?.(null);
          }}
        >
          <XAxis
            dataKey="month"
            tick={{ fill: "#a5b4fc", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
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
            formatter={(value: any) => {
              const num = Number(value);
              const label = String(dataKey).charAt(0).toUpperCase() + String(dataKey).slice(1);
              if (!isNaN(num)) {
                if (dataKey === "revenue") {
                  return [`₹${num.toFixed(2)}`, label];
                }
                return [Number.isInteger(num) ? num : num.toFixed(2), label];
              }
              return [value, label];
            }}
          />
          <Bar
            dataKey={dataKey as string}
            fill={`url(#${gradientId})`}
            radius={[8, 8, 0, 0]}
            activeBar={{ stroke: 'none' }}
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
