"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  CalendarDays,
  TrendingUp,
  Award,
  BarChart3,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface MonthData {
  month: number;
  name: string;
  shortName: string;
  count: number;
}

export function LeadOverviewChart() {
  const { leads, stats } = useCRM();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(Math.max(currentYear, 2026));
  const [availableYears, setAvailableYears] = useState<number[]>([
    Math.max(currentYear, 2026),
  ]);
  const [months, setMonths] = useState<MonthData[]>([
    { month: 1, name: "January", shortName: "Jan", count: 0 },
    { month: 2, name: "February", shortName: "Feb", count: 0 },
    { month: 3, name: "March", shortName: "Mar", count: 0 },
    { month: 4, name: "April", shortName: "Apr", count: 0 },
    { month: 5, name: "May", shortName: "May", count: 0 },
    { month: 6, name: "June", shortName: "Jun", count: 0 },
    { month: 7, name: "July", shortName: "Jul", count: 0 },
    { month: 8, name: "August", shortName: "Aug", count: 0 },
    { month: 9, name: "September", shortName: "Sep", count: 0 },
    { month: 10, name: "October", shortName: "Oct", count: 0 },
    { month: 11, name: "November", shortName: "Nov", count: 0 },
    { month: 12, name: "December", shortName: "Dec", count: 0 },
  ]);
  const [totalYearLeads, setTotalYearLeads] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Fetch monthly lead overview data for the selected year from backend DB
  const fetchOverview = useCallback(async (year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/lead-overview?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.months) && data.months.length === 12) {
            setMonths(data.months);
          }
          if (Array.isArray(data.availableYears) && data.availableYears.length > 0) {
            setAvailableYears(data.availableYears);
          }
          setTotalYearLeads(data.totalYearLeads ?? 0);
        }
      }
    } catch (err) {
      console.error("Failed to load lead overview chart data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(selectedYear);
  }, [selectedYear, fetchOverview]);

  // Re-fetch when CRM stats or leads update (e.g. after adding/importing a new lead)
  useEffect(() => {
    if (stats || leads.length) {
      fetchOverview(selectedYear);
    }
  }, [stats, leads.length, selectedYear, fetchOverview]);

  // Calculations for chart scaling and highlights
  const { maxCount, peakMonth, monthlyAverage } = useMemo(() => {
    let max = 0;
    let peak: MonthData = months[0];
    let total = 0;

    for (const m of months) {
      total += m.count;
      if (m.count > max) {
        max = m.count;
        peak = m;
      }
    }

    // Give Y-axis scale headroom
    const scaleMax = max > 0 ? Math.ceil(max * 1.15) : 10;
    const avg = total > 0 ? (total / 12).toFixed(1) : "0";

    return {
      maxCount: Math.max(scaleMax, 5),
      peakMonth: peak,
      monthlyAverage: avg,
    };
  }, [months]);

  // Y-axis grid increments (4 ticks)
  const yTicks = useMemo(() => {
    const tickCount = 4;
    const step = maxCount / tickCount;
    return [
      Math.round(step * 4),
      Math.round(step * 3),
      Math.round(step * 2),
      Math.round(step * 1),
      0,
    ];
  }, [maxCount]);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-6 transition-colors">
      {/* Top Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Lead Overview</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalYearLeads} {totalYearLeads === 1 ? "Lead" : "Leads"} in {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Total number of leads created & added to the CRM per month
          </p>
        </div>

        {/* Dynamic Select Year Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="lead-overview-year-select"
            className="text-xs font-semibold text-slate-500 whitespace-nowrap"
          >
            Select Year:
          </label>
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <select
              id="lead-overview-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="appearance-none pl-8 pr-8 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-6 pb-2">
        {/* Loading overlay indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-2xs z-20 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Loading {selectedYear} data...</span>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {/* Y-Axis scale numbers */}
          <div className="flex flex-col justify-between h-56 text-[11px] font-mono text-slate-400 font-semibold text-right pr-1 select-none">
            {yTicks.map((tick, idx) => (
              <span key={idx} className="leading-none">
                {tick}
              </span>
            ))}
          </div>

          {/* Chart Grid & 12 Monthly Bars */}
          <div className="flex-1 relative h-56 flex flex-col justify-end">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, idx) => (
                <div
                  key={idx}
                  className="w-full border-b border-slate-100 border-dashed"
                />
              ))}
            </div>

            {/* 12 Month Columns */}
            <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-2 md:gap-3 items-end h-full px-1">
              {months.map((m) => {
                const heightPercent =
                  maxCount > 0 ? Math.round((m.count / maxCount) * 100) : 0;
                const isHovered = hoveredMonth === m.month;
                const isPeak = m.count > 0 && m.count === peakMonth.count;

                return (
                  <div
                    key={m.month}
                    className="relative flex flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredMonth(m.month)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-3 z-30 px-3 py-2 rounded-xl bg-slate-900 text-white shadow-xl pointer-events-none text-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[11px] font-medium text-slate-300">
                          {m.name} {selectedYear}
                        </div>
                        <div className="text-sm font-extrabold text-white">
                          {m.count} {m.count === 1 ? "Lead" : "Leads"}
                        </div>
                        {totalYearLeads > 0 && (
                          <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                            {Math.round((m.count / totalYearLeads) * 100)}% of annual volume
                          </div>
                        )}
                        {/* Tooltip caret */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-slate-900" />
                      </div>
                    )}

                    {/* Exact count label above the bar */}
                    <div
                      className={`text-[10px] sm:text-xs font-bold mb-1.5 transition-all ${
                        isHovered
                          ? "text-indigo-600 scale-110"
                          : m.count > 0
                          ? "text-slate-800"
                          : "text-slate-400 font-medium"
                      }`}
                    >
                      {m.count}
                    </div>

                    {/* The Bar */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end relative h-full">
                      {m.count > 0 ? (
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                            isPeak
                              ? "bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500"
                              : isHovered
                              ? "bg-gradient-to-t from-indigo-600 to-indigo-500"
                              : "bg-indigo-600 hover:bg-indigo-500"
                          } ${isHovered ? "brightness-110 shadow-md" : ""}`}
                          style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        />
                      ) : (
                        <div className="w-full h-1 bg-slate-200/80 rounded-full" />
                      )}
                    </div>

                    {/* Month Label below */}
                    <div className="pt-2 text-center select-none">
                      <span
                        className={`text-[10px] sm:text-xs font-semibold block transition-colors ${
                          isHovered
                            ? "text-indigo-600 font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        <span className="inline sm:hidden">{m.shortName.charAt(0)}</span>
                        <span className="hidden sm:inline md:hidden">{m.shortName}</span>
                        <span className="hidden md:inline">{m.shortName}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Year Total
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {totalYearLeads.toLocaleString()} Leads
            </div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Average
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {monthlyAverage} / mo
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Peak Month
            </span>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {peakMonth.count > 0 ? `${peakMonth.name} (${peakMonth.count})` : "—"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
