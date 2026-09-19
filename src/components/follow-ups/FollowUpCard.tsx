"use client";

import React, { useState } from "react";
import { Lead, Channel, Priority, FollowUpItem, FollowUpHistoryItem } from "@/lib/types";
import { useCRM } from "@/lib/context/crm-context";
import { ChannelIcon, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FollowUpDetailsModal } from "./FollowUpDetailsModal";
import { formatEnglishDate } from "@/lib/transformers";
import { formatDateTime } from "@/lib/date-utils";
import {
  Calendar,
  Clock,
  Send,
  CalendarDays,
  CheckCircle2,
  Eye,
  MessageSquare,
  Mail,
  Tag,
  AlertCircle,
  Clock3,
  FileText,
  Check,
  RotateCcw,
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
  groupKey: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  lead?: Lead;
  channel: Channel;
  followUp: FollowUpItem;
  primaryFollowUp: FollowUpItem;
  followUpItems: FollowUpItem[];
  activities: GroupedFollowUpActivity[];
  status: "today" | "upcoming" | "overdue" | "completed";
  priority: Priority;
  dueDate: string;
  dueTime?: string;
  completedAt?: string;
  currentStep: number;
  intervalDays?: number;
  templateCategory?: string;
  templateName?: string;
  subject?: string;
  isRescheduled?: boolean;
  rescheduleNotice?: string;
  history?: FollowUpHistoryItem[];
  firstFollowUpScheduledAt?: string;
  firstFollowUpSentAt?: string;
  secondFollowUpScheduledAt?: string;
  secondFollowUpSentAt?: string;
}

interface FollowUpCardProps {
  item: GroupedFollowUpLead;
}

function formatCardDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  return formatDateTime(dateInput);
}

export function FollowUpCard({ item }: FollowUpCardProps) {
  const {
    leads,
    openOutreach,
    openLeadDetails,
    completeFollowUp,
    openReschedule,
  } = useCRM();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const lead = item.lead || leads.find((l) => l.id === item.leadId);

  const isCompleted = item.status === "completed" || item.currentStep > 2;
  const isOverdue = item.status === "overdue";
  const isToday = item.status === "today";

  const fu = item.followUp || item.primaryFollowUp;
  const channel = item.channel || fu.channel || "email";

  const handleContinueOutreach = () => {
    if (lead) {
      openOutreach(lead, channel, undefined, true);
    }
  };

  const handleComplete = () => {
    if (fu?.id) {
      completeFollowUp(fu.id);
    }
  };

  // Step 1 status info
  const step1Sent = Boolean(item.firstFollowUpSentAt);
  const step1SentFormatted = item.firstFollowUpSentAt
    ? formatCardDateTime(item.firstFollowUpSentAt)
    : "";

  // Step 2 status info
  const step2Sent = Boolean(item.secondFollowUpSentAt);
  const step2SentFormatted = item.secondFollowUpSentAt
    ? formatCardDateTime(item.secondFollowUpSentAt)
    : "";

  return (
    <>
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
          isCompleted
            ? "bg-slate-50/70 border-slate-200/80 opacity-80"
            : isOverdue
            ? "bg-white border-rose-200/90 shadow-2xs hover:border-rose-300 hover:shadow-xs ring-1 ring-rose-500/10"
            : isToday
            ? "bg-white border-amber-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs ring-1 ring-amber-500/15"
            : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs"
        }`}
      >
        <div className="space-y-3.5">
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-extrabold text-slate-900 truncate tracking-tight">
                  {item.businessName}
                </h4>
                <PriorityBadge priority={item.priority} />

                {/* Platform Badge */}
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200/70 capitalize">
                  <ChannelIcon channel={channel} size="sm" />
                  {channel}
                </span>

                {/* Cadence Step Badge */}
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Completed (2/2)
                  </span>
                ) : item.currentStep === 2 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    2nd Follow-up
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    1st Follow-up
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium truncate">
                Contact Person:{" "}
                <span className="text-slate-800 font-semibold">
                  {item.contactPerson}
                </span>
              </p>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
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

          {/* Template Category & Specific Template & Subject Box */}
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
            {/* Template Info Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Template:</span>
              </div>
              <span className="font-bold text-slate-800">
                {item.templateCategory || "Custom Message"}
              </span>
              {item.templateName && item.templateName !== item.templateCategory && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                    {item.templateName}
                  </span>
                </>
              )}
            </div>

            {/* Email Subject Row (if applicable) */}
            {item.subject && (
              <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-slate-200/60 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-medium">Subject:</span>
                <span className="font-semibold text-slate-900 truncate">
                  &quot;{item.subject}&quot;
                </span>
              </div>
            )}

            {/* Message Preview */}
            {(item.activities[0]?.messagePreview || fu?.notes || fu?.originalMessagePreview) && (
              <p className="text-xs text-slate-600 font-mono line-clamp-2 leading-relaxed pt-1">
                &quot;
                {item.activities[0]?.messagePreview ||
                  fu?.notes ||
                  fu?.originalMessagePreview ||
                  "Outreach message sent"}
                &quot;
              </p>
            )}
          </div>

          {/* Rescheduled Notice Banner */}
          {item.isRescheduled && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {item.rescheduleNotice ||
                  `Rescheduled: Next follow-up adjusted dynamically based on actual send date.`}
              </span>
            </div>
          )}

          {/* Cadence Step Tracker (Permanent History View) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Step 1 Box */}
            <div
              className={`p-2.5 rounded-xl border ${
                step1Sent
                  ? "bg-emerald-50/50 border-emerald-200/80"
                  : item.currentStep === 1
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-slate-50 border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <span>1st Follow-up</span>
                  {step1Sent ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : null}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    step1Sent
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {step1Sent ? "Sent" : "Pending"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {step1Sent
                  ? `Sent: ${step1SentFormatted}`
                  : `Due: ${item.firstFollowUpScheduledAt || item.dueDate}`}
              </p>
            </div>

            {/* Step 2 Box */}
            <div
              className={`p-2.5 rounded-xl border ${
                step2Sent
                  ? "bg-emerald-50/50 border-emerald-200/80"
                  : item.currentStep === 2
                  ? "bg-indigo-50/60 border-indigo-200"
                  : "bg-slate-50 border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <span>2nd Follow-up</span>
                  {step2Sent ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : null}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    step2Sent
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {step2Sent ? "Sent" : "Pending"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {step2Sent
                  ? `Sent: ${step2SentFormatted}`
                  : item.secondFollowUpScheduledAt
                  ? `Due: ${item.secondFollowUpScheduledAt}`
                  : "Pending 1st send"}
              </p>
            </div>
          </div>

          {/* Timestamp Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                Due: {item.dueDate} {item.dueTime ? `at ${item.dueTime}` : ""}
              </span>
            </span>

            {item.completedAt && (
              <span className="text-emerald-600 font-semibold">
                Completed: {formatCardDateTime(item.completedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-1">
            {/* View History / Audit Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDetailsOpen(true)}
              leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
              className="text-xs text-indigo-700 hover:bg-indigo-50"
            >
              Details & History
            </Button>

            {lead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openLeadDetails(lead.id)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                className="text-xs text-slate-600"
              >
                Lead
              </Button>
            )}

            {!isCompleted && fu?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openReschedule(
                    fu.id,
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
                onClick={handleComplete}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                className="text-xs hover:border-emerald-300 hover:bg-emerald-50/40"
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
                {isCompleted
                  ? "New Outreach"
                  : item.currentStep === 2
                  ? "Send 2nd Follow-up"
                  : "Send 1st Follow-up"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details & Permanent History Audit Modal */}
      <FollowUpDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        followUp={fu}
        lead={lead}
        onContinueOutreach={handleContinueOutreach}
      />
    </>
  );
}
