"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCRM } from "@/lib/context/crm-context";
import { LeadStatus } from "@/lib/types";
import {
  Sparkles,
  ChevronRight,
  Flame,
  ArrowRight,
  TrendingUp,
  UserCheck,
  PhoneCall,
  MessageCircle,
  Calendar,
  FileCheck2,
  Trophy,
  XCircle,
} from "lucide-react";
import { LeadStatusBadge } from "@/components/ui/Badge";

export function LeadPipeline() {
  const { leads, openLeadDetails } = useCRM();
  const [selectedStage, setSelectedStage] = useState<LeadStatus | null>(null);

  const stages: {
    status: LeadStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    bgAccent: string;
  }[] = [
    {
      status: "New",
      label: "New Leads",
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
      color: "text-blue-700",
      borderColor: "border-blue-200",
      bgAccent: "bg-blue-500",
    },
    {
      status: "Qualified",
      label: "Qualified",
      icon: <UserCheck className="w-3.5 h-3.5 text-cyan-600" />,
      color: "text-cyan-700",
      borderColor: "border-cyan-200",
      bgAccent: "bg-cyan-500",
    },
    {
      status: "Contacted",
      label: "Contacted",
      icon: <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />,
      color: "text-indigo-700",
      borderColor: "border-indigo-200",
      bgAccent: "bg-indigo-500",
    },
    {
      status: "Replied",
      label: "Replied",
      icon: <MessageCircle className="w-3.5 h-3.5 text-purple-600" />,
      color: "text-purple-700",
      borderColor: "border-purple-200",
      bgAccent: "bg-purple-500",
    },
    {
      status: "Interested",
      label: "Interested 🔥",
      icon: <Flame className="w-3.5 h-3.5 text-amber-600" />,
      color: "text-amber-700",
      borderColor: "border-amber-200",
      bgAccent: "bg-amber-500",
    },
    {
      status: "Meeting",
      label: "Meeting 📅",
      icon: <Calendar className="w-3.5 h-3.5 text-violet-600" />,
      color: "text-violet-700",
      borderColor: "border-violet-200",
      bgAccent: "bg-violet-500",
    },
    {
      status: "Proposal",
      label: "Proposal",
      icon: <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />,
      color: "text-emerald-700",
      borderColor: "border-emerald-200",
      bgAccent: "bg-emerald-500",
    },
    {
      status: "Won",
      label: "Won Deals 🎉",
      icon: <Trophy className="w-3.5 h-3.5 text-emerald-700" />,
      color: "text-emerald-800 font-bold",
      borderColor: "border-emerald-300",
      bgAccent: "bg-emerald-600",
    },
    {
      status: "Lost",
      label: "Lost / Archive",
      icon: <XCircle className="w-3.5 h-3.5 text-slate-400" />,
      color: "text-slate-500",
      borderColor: "border-slate-200",
      bgAccent: "bg-slate-400",
    },
  ];

  // Calculate live counts
  const stageCounts: Record<LeadStatus, number> = {
    New: 0,
    Qualified: 0,
    Contacted: 0,
    Replied: 0,
    Interested: 0,
    "Follow-up": 0,
    Meeting: 0,
    Proposal: 0,
    Won: 0,
    Lost: 0,
  };

  leads.forEach((lead) => {
    if (stageCounts[lead.status] !== undefined) {
      stageCounts[lead.status]++;
    }
  });

  const totalPipelineLeads = leads.length;

  const leadsInSelectedStage = selectedStage
    ? leads.filter((l) => l.status === selectedStage)
    : [];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Lead Conversion Pipeline
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              {totalPipelineLeads} Active Leads
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Realtime stage breakdown from initial discovery to closed client contracts
          </p>
        </div>

        <Link
          href="/leads"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
        >
          <span>View full pipeline table</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Pipeline Stages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {stages.map((stage) => {
          const count = stageCounts[stage.status];
          const percentage =
            totalPipelineLeads > 0
              ? Math.round((count / totalPipelineLeads) * 100)
              : 0;
          const isSelected = selectedStage === stage.status;

          return (
            <button
              key={stage.status}
              type="button"
              onClick={() =>
                setSelectedStage(isSelected ? null : stage.status)
              }
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                isSelected
                  ? "bg-indigo-50/80 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20"
                  : "bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {stage.icon}
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    {stage.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {count}
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stage.bgAccent}`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>{percentage}%</span>
                  <span className="opacity-0 group-hover:opacity-100 text-indigo-600 font-semibold transition-opacity">
                    View &rarr;
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Leads Preview Drawer/Tray */}
      {selectedStage && (
        <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950">
                Leads currently in &quot;{selectedStage}&quot; stage ({leadsInSelectedStage.length})
              </span>
              <LeadStatusBadge status={selectedStage} size="sm" />
            </div>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Close preview ✕
            </button>
          </div>

          {leadsInSelectedStage.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {leadsInSelectedStage.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => openLeadDetails(lead.id)}
                  className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {lead.businessName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {lead.ceoName ? `${lead.ceoName} • ` : ""}
                      {lead.location}
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-400 hover:text-indigo-600">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No leads currently in the {selectedStage} stage.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
