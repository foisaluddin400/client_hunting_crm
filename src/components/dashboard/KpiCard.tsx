import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  period?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  description?: string;
  highlight?: boolean;
}

export function KpiCard({
  title,
  value,
  change,
  changeType = "increase",
  period = "vs last month",
  icon,
  iconBgColor = "bg-indigo-50 text-indigo-600",
  description,
  highlight = false,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group",
        highlight && "ring-2 ring-indigo-500/20 border-indigo-200"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
        </div>

        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        {change ? (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[11px]",
                changeType === "increase"
                  ? "bg-emerald-50 text-emerald-700"
                  : changeType === "decrease"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              {changeType === "increase" ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : changeType === "decrease" ? (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ) : null}
              {change}
            </span>
            <span className="text-slate-400 text-[11px] truncate">{period}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] truncate">{description}</span>
        )}

        {description && change && (
          <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
