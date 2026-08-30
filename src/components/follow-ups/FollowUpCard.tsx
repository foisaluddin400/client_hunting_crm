"use client";

import React from "react";
import { Lead, Channel, Priority } from "@/lib/types";
import { useCRM } from "@/lib/context/crm-context";
import { ChannelIcon, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  Send,
  CalendarDays,
  CheckCircle2,
  Eye,
  MessageSquare,
  Sparkles,
  Layers,
} from "lucide-react";

export interface GroupedFollowUpActivity {
  id: string;
  channel: Channel;
  type?: string;
  messagePreview?: string;
  date: string;
  time?: string;
  status: string;
  notes?: string;
}

export interface GroupedFollowUpLead {
  leadId: string;
  businessName: string;
  contactPerson: string;
  lead?: Lead;
  primaryFollowUp: {
    id: string;
    dueDate: string;
    dueTime?: string;
    channel: Channel;
    notes?: string;
    status: string;
  };
  followUpItems: Array<{
    id: string;
    channel: Channel;
    dueDate: string;
    dueTime?: string;
    status: string;
    notes?: string;
  }>;
  activities: GroupedFollowUpActivity[];
  status: "today" | "upcoming" | "overdue" | "completed";
  priority: Priority;
  dueDate: string;
  dueTime?: string;
  completedAt?: string;
}

interface FollowUpCardProps {
  item: GroupedFollowUpLead;
}

export function FollowUpCard({ item }: FollowUpCardProps) {
  const {
    leads,
    openOutreach,
    openLeadDetails,
    completeFollowUp,
    openReschedule,
  } = useCRM();

  const lead = item.lead || leads.find((l) => l.id === item.leadId);

  const isCompleted = item.status === "completed";
  const isOverdue = item.status === "overdue";
  const isToday = item.status === "today";

  // Primary channel for quick continue outreach
  const primaryChannel: Channel =
    item.activities[0]?.channel || item.primaryFollowUp.channel || "email";

  const handleContinueOutreach = () => {
    if (lead) {
      openOutreach(
        lead,
        primaryChannel,
        `Hi ${item.contactPerson || "there"},\n\nJust following up on my previous message regarding ${item.businessName}...`
      );
    }
  };

  const handleCompleteAll = () => {
    for (const fu of item.followUpItems) {
      if (fu.status !== "completed") {
        completeFollowUp(fu.id);
      }
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
        isCompleted
          ? "bg-slate-50/70 border-slate-200/80 opacity-75"
          : isOverdue
          ? "bg-white border-rose-200/90 shadow-2xs hover:border-rose-300 hover:shadow-xs"
          : isToday
          ? "bg-white border-amber-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs ring-1 ring-amber-500/10"
          : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {item.businessName}
              </h4>
              <PriorityBadge priority={item.priority} />
              {item.activities.length > 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Layers className="w-3 h-3" />
                  {item.activities.length} Channels
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              Contact:{" "}
              <span className="text-slate-700 font-semibold">
                {item.contactPerson}
              </span>
            </p>
          </div>

          {/* Due Status Tag */}
          <div className="shrink-0 flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isOverdue
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : isToday
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isCompleted
                  ? "Completed"
                  : isToday
                  ? "Due Today"
                  : isOverdue
                  ? "Overdue"
                  : `Due ${item.dueDate}`}
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Outreach / Follow-ups Section */}
        <div className="space-y-2">
          {item.activities.length > 1 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-0.5">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Outreach / Follow-ups:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.activities.length} total
                </span>
              </div>

              {/* Scrollable list for multi-channel history */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {item.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1.5 hover:bg-white hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <ChannelIcon channel={act.channel} size="sm" />
                        <span className="capitalize">{act.channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {act.date && (
                          <span className="text-slate-400 font-medium text-[11px]">
                            Date: {act.date}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            act.status === "Completed" ||
                            act.status === "Delivered" ||
                            act.status === "Replied"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : act.status === "Sent"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          Status: {act.status}
                        </span>
                      </div>
                    </div>

                    {act.messagePreview && (
                      <p className="text-xs text-slate-600 font-mono line-clamp-2 leading-relaxed">
                        &quot;{act.messagePreview}&quot;
                      </p>
                    )}

                    {act.notes && (
                      <p className="text-[11px] text-indigo-700 font-sans font-medium pt-1 border-t border-slate-200/60">
                        Note: {act.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Single activity representation matching original card design */
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <ChannelIcon channel={item.activities[0]?.channel || primaryChannel} size="sm" />
                  <span className="capitalize">
                    {item.activities[0]?.channel || primaryChannel} Outreach:
                  </span>
                </div>
                {item.activities[0]?.status && (
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Status: {item.activities[0].status}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 font-mono line-clamp-2 leading-relaxed">
                &quot;{item.activities[0]?.messagePreview || item.primaryFollowUp.notes || "Initial outreach sent"}&quot;
              </p>

              {item.activities[0]?.notes && (
                <p className="text-[11px] text-indigo-700 font-sans font-medium pt-1 border-t border-slate-200/60">
                  Note: {item.activities[0].notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              Due {item.dueDate} {item.dueTime ? `at ${item.dueTime}` : ""}
            </span>
          </span>

          {item.completedAt && (
            <span className="text-emerald-600 font-medium">
              Done: {item.completedAt}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          {lead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openLeadDetails(lead.id)}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              className="text-xs text-slate-600"
            >
              View Lead
            </Button>
          )}

          {!isCompleted && item.primaryFollowUp?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                openReschedule(
                  item.primaryFollowUp.id,
                  item.businessName,
                  item.dueDate
                )
              }
              leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
              className="text-xs text-slate-600"
            >
              Reschedule
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompleteAll}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs"
            >
              Complete
            </Button>
          )}

          {lead && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleContinueOutreach}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-2xs"
            >
              {isCompleted ? "New Outreach" : "Continue Outreach"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
