"use client";

import React from "react";
import Link from "next/link";
import { useCRM } from "@/lib/context/crm-context";
import { ChannelIcon } from "@/components/ui/Badge";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Clock,
  ChevronRight,
  MessageSquare,
  Mail,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export function RecentActivity() {
  const { leads, openLeadDetails, openOutreach } = useCRM();

  // Aggregate all activities across all leads with lead context
  const allActivities: {
    id: string;
    leadId: string;
    businessName: string;
    ceoName?: string;
    channel: string;
    type: string;
    date: string;
    time?: string;
    messagePreview?: string;
    status: string;
    leadObject: any;
  }[] = [];

  leads.forEach((lead) => {
    (lead.activities || []).forEach((act) => {
      allActivities.push({
        id: act.id,
        leadId: lead.id,
        businessName: lead.businessName,
        ceoName: lead.ceoName,
        channel: act.channel,
        type: act.type,
        date: act.date,
        time: act.time,
        messagePreview: act.messagePreview,
        status: act.status,
        leadObject: lead,
      });
    });
  });

  // Sort by date/time descending
  allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentList = allActivities.slice(0, 6);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Outreach & Activity
          </h3>
          <p className="text-xs text-slate-500">
            Latest communications, status updates, and lead additions
          </p>
        </div>

        <Link
          href="/leads"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
        >
          <span>All activity</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {recentList.length > 0 ? (
          recentList.map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0 mt-0.5">
                  <ChannelIcon channel={item.channel} size="md" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openLeadDetails(item.leadId)}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors"
                    >
                      {item.businessName}
                    </button>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {item.type}
                    </span>
                  </div>

                  {item.messagePreview && (
                    <p className="text-xs text-slate-500 truncate max-w-md">
                      {item.messagePreview}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.date} {item.time ? `at ${item.time}` : ""}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold text-[9px]">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => openLeadDetails(item.leadId)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="View Lead Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            No activities recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
