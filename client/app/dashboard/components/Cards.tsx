"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface MonthlyPoint {
  month: string;
  revenue: number;
  sales: number;
}

type KPIProps = {
  title: string,
  value: string | number,
}

type GlassProps = {
  title: React.ReactNode,
  children: React.ReactNode,
}

type MenuItemProps = {
  label: string,
  danger?: boolean,
  onClick: () => void,
  icon?: React.ReactNode,
  badge?: number ,
}

export function KPI({ title, value }: KPIProps) {
  return (
    <div className="group bg-linear-to-br from-white/10 via-white/5 to-transparent border border-white/20 hover:border-white/30 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
      <p className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors">{title}</p>
      <p className="text-3xl font-black mt-2 bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-blue-300 transition-all">{value}</p>
      <div className="mt-3 h-1 w-0 group-hover:w-full bg-linear-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"></div>
    </div>
  );
};

export function Glass({ title, children }: GlassProps) {
  return (
    <div className="bg-linear-to-br from-white/10 via-white/5 to-transparent border border-white/20 hover:border-white/30 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300">
      <h3 className="mb-4 font-bold text-base text-white flex items-center gap-2">{title}</h3>
      {children}
    </div>
  );
}

export function MenuItem({ label, danger, onClick, icon, badge }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center justify-between group relative overflow-hidden
        ${danger ? "text-red-400 hover:bg-red-500/15 hover:border-l-2 hover:border-red-400" : "text-white/80 hover:text-white hover:bg-white/10 hover:border-l-2 hover:border-indigo-400"}`}
    >
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative flex items-center gap-3">
        {icon && <span className="text-lg group-hover:scale-110 transition-transform duration-200">{icon}</span>}
        <span className="font-medium group-hover:font-semibold transition-all">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="relative bg-linear-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full px-2.5 py-1 font-bold min-w-6 text-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export function ChartArea({ data }: { data: MonthlyPoint[] }) {
  const hasData = Array.isArray(data) && data.length > 0 && data.some(d => d.revenue > 0);
  return (
    <div className="h-32 md:h-36 flex items-center justify-center">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#67e8f9', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#fff', boxShadow: '0 4px 24px #06b6d4aa' }} cursor={{ fill: '#38bdf822' }} />
            <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} fill="url(#colorRevenue)" dot={{ r: 3, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1 }} isAnimationActive={true} animationDuration={900} />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.7}/>
                <stop offset="80%" stopColor="#a5b4fc" stopOpacity={0.13}/>
                <stop offset="100%" stopColor="#fff" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center w-full text-cyan-300/70 text-xs md:text-sm select-none">
          <span className="text-2xl block mb-1">📉</span>
          No revenue data to display
        </div>
      )}
    </div>
  );
}

export function ChartBar({ data }: { data: MonthlyPoint[] }) {
  const hasData = Array.isArray(data) && data.length > 0 && data.some(d => d.sales > 0);
  return (
    <div className="h-32 md:h-36 flex items-center justify-center">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#a5b4fc', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: 10, color: '#fff', boxShadow: '0 4px 24px #6366f1aa' }} cursor={{ fill: '#6366f122' }} />
            <Bar dataKey="sales" fill="url(#colorSales)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={900} />
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.8}/>
                <stop offset="80%" stopColor="#38bdf8" stopOpacity={0.18}/>
                <stop offset="100%" stopColor="#fff" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center w-full text-indigo-300/70 text-xs md:text-sm select-none">
          <span className="text-2xl block mb-1">📊</span>
          No sales data to display
        </div>
      )}
    </div>
  );
}

export function Row({ left, right }: any) {
  return (
    <div className="flex justify-between py-2 border-b border-white/10 last:border-0">
      <span>{left}</span>
      <span className="text-white/60">{right}</span>
    </div>
  );
}