"use client";

import React from "react";
import { FollowUpItem, Channel, Lead } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ChannelIcon } from "@/components/ui/Badge";
import { formatEnglishDate } from "@/lib/transformers";
import { CRM_TIMEZONE, formatDate } from "@/lib/date-utils";
import {
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Tag,
  Mail,
  FileText,
  Repeat,
  ArrowRight,
  User,
  Building2,
  CalendarCheck,
} from "lucide-react";

interface FollowUpDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUpItem | null;
  lead?: Lead | null;
  onContinueOutreach?: () => void;
}

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(d);
}

function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Not sent yet";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Not sent yet";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CRM_TIMEZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function FollowUpDetailsModal({
  isOpen,
  onClose,
  followUp,
  lead,
  onContinueOutreach,
}: FollowUpDetailsModalProps) {
  if (!isOpen || !followUp) return null;

  const currentStep = followUp.currentStep || (followUp.status === "completed" ? 3 : 1);
  const isCompleted = followUp.status === "completed" || currentStep > 2;
  const isOverdue = followUp.status === "overdue";
  const isToday = followUp.status === "today";

  const historyEntries = followUp.history || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <ChannelIcon channel={followUp.channel} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">
                {followUp.businessName}
              </span>
              <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {followUp.channel} Cadence
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Contact: {followUp.contactPerson}
            </p>
          </div>
        </div>
      }
      description="Multi-Touch Follow-up Progress & Chronological Activity Log"
    >
      <div className="space-y-5">
        {/* Cadence Visual Stepper */}
        <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>CADENCE PROGRESS</span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800"
                  : isOverdue
                  ? "bg-rose-100 text-rose-800"
                  : isToday
                  ? "bg-amber-100 text-amber-800"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              Status: {followUp.status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            {/* Step 0: Original Message */}
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <div className="w-5 h-5 mx-auto mb-1 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span className="block text-[11px] font-bold text-slate-900">
                Original Message
              </span>
              <span className="text-[10px] text-slate-500">
                {followUp.originalMessageDate || "Sent"}
              </span>
            </div>

            {/* Step 1: 1st Follow-up */}
            <div
              className={`p-2.5 rounded-xl border shadow-2xs transition-all ${
                followUp.firstFollowUpSentAt
                  ? "bg-white border-emerald-200"
                  : currentStep === 1
                  ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div
                className={`w-5 h-5 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  followUp.firstFollowUpSentAt
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {followUp.firstFollowUpSentAt ? "✓" : "1"}
              </div>
              <span className="block text-[11px] font-bold text-slate-900">
                1st Follow-up
              </span>
              <span className="text-[10px] text-slate-500">
                {followUp.firstFollowUpSentAt
                  ? "Sent"
                  : `Due ${followUp.firstFollowUpScheduledAt || followUp.dueDate}`}
              </span>
            </div>

            {/* Step 2: 2nd Follow-up */}
            <div
              className={`p-2.5 rounded-xl border shadow-2xs transition-all ${
                followUp.secondFollowUpSentAt
                  ? "bg-white border-emerald-200"
                  : currentStep === 2
                  ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div
                className={`w-5 h-5 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  followUp.secondFollowUpSentAt
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                {followUp.secondFollowUpSentAt ? "✓" : "2"}
              </div>
              <span className="block text-[11px] font-bold text-slate-900">
                2nd Follow-up
              </span>
              <span className="text-[10px] text-slate-500">
                {followUp.secondFollowUpSentAt
                  ? "Sent"
                  : followUp.secondFollowUpScheduledAt
                  ? `Due ${followUp.secondFollowUpScheduledAt}`
                  : "Pending step 1"}
              </span>
            </div>

            {/* Step 3: Completed */}
            <div
              className={`p-2.5 rounded-xl border shadow-2xs transition-all ${
                isCompleted
                  ? "bg-white border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div
                className={`w-5 h-5 mx-auto mb-1 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                ✓
              </div>
              <span className="block text-[11px] font-bold text-slate-900">
                Completed
              </span>
              <span className="text-[10px] text-slate-500">
                {isCompleted ? "Cadence done" : "After 2nd"}
              </span>
            </div>
          </div>

          {/* Rescheduled Notice Banner */}
          {followUp.rescheduleNotice && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Clock3 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{followUp.rescheduleNotice}</span>
            </div>
          )}
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Card 1: Client & Channels */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Contact & Platforms
            </span>
            <div className="space-y-1 text-slate-700">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Client Name:</span>
                <strong className="text-slate-900">{followUp.businessName}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Decision Maker:</span>
                <strong className="text-slate-900">{followUp.contactPerson}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Original Platform:</span>
                <strong className="capitalize text-slate-900 flex items-center gap-1">
                  <ChannelIcon channel={followUp.channel} size="sm" />
                  {followUp.channel}
                </strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Follow-up Platform:</span>
                <strong className="capitalize text-slate-900 flex items-center gap-1">
                  <ChannelIcon channel={followUp.channel} size="sm" />
                  {followUp.channel}
                </strong>
              </p>
            </div>
          </div>

          {/* Card 2: Templates & Subject */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Template & Subject Tracking
            </span>
            <div className="space-y-1 text-slate-700">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Outreach Template:</span>
                <strong className="text-slate-900">
                  {followUp.templateCategory || "General Introduction"}
                </strong>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Specific Template:</span>
                <strong className="text-slate-900 truncate max-w-[180px]">
                  {followUp.templateName || followUp.templateCategory || "Default"}
                </strong>
              </p>
              {followUp.channel === "email" && (
                <p className="flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                  <span className="text-slate-500">Email Subject:</span>
                  <strong className="text-indigo-700 truncate max-w-[180px]">
                    {followUp.subject || "No subject specified"}
                  </strong>
                </p>
              )}
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Follow-up Interval:</span>
                <strong className="text-slate-900">
                  Every {followUp.intervalDays || 3} days
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Step Dates & Timestamps Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Cadence Dates & Actual Sent Timestamps
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>1st Follow-up:</span>
              </span>
              <p className="text-slate-600 text-[11px]">
                Scheduled:{" "}
                <strong>
                  {followUp.firstFollowUpScheduledAt
                    ? formatEnglishDate(followUp.firstFollowUpScheduledAt)
                    : formatEnglishDate(followUp.dueDate)}
                </strong>
              </p>
              <p className="text-slate-600 text-[11px]">
                Sent Date &amp; Time:{" "}
                <strong className={followUp.firstFollowUpSentAt ? "text-emerald-700" : "text-slate-400"}>
                  {followUp.firstFollowUpSentAt
                    ? `${formatDateTime(followUp.firstFollowUpSentAt)} (${formatRelativeTime(followUp.firstFollowUpSentAt)})`
                    : "Not sent yet"}
                </strong>
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>2nd Follow-up:</span>
              </span>
              <p className="text-slate-600 text-[11px]">
                Scheduled:{" "}
                <strong>
                  {followUp.secondFollowUpScheduledAt
                    ? formatEnglishDate(followUp.secondFollowUpScheduledAt)
                    : currentStep === 2
                    ? formatEnglishDate(followUp.dueDate)
                    : "Calculated after 1st send"}
                </strong>
              </p>
              <p className="text-slate-600 text-[11px]">
                Sent Date &amp; Time:{" "}
                <strong className={followUp.secondFollowUpSentAt ? "text-emerald-700" : "text-slate-400"}>
                  {followUp.secondFollowUpSentAt
                    ? `${formatDateTime(followUp.secondFollowUpSentAt)} (${formatRelativeTime(followUp.secondFollowUpSentAt)})`
                    : "Not sent yet"}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Permanent History Entries List (Requirement 1) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <span>Follow-up History Log ({historyEntries.length} Sent)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Permanent Audit Records (Max 2)
            </span>
          </div>

          {historyEntries.length > 0 ? (
            <div className="space-y-2">
              {historyEntries.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-xs hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-extrabold">
                        {h.followUpNumber}
                      </span>
                      <span>
                        {h.followUpNumber === 1 ? "1st Follow-up" : "2nd Follow-up"}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Follow-up Sent: Yes
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <span>{formatDateTime(h.sentAt)}</span>
                      {h.sentAt && (
                        <span className="ml-1 text-slate-400">
                          ({formatRelativeTime(h.sentAt)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Template & Subject */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span>
                      Platform: <strong className="capitalize">{h.channel}</strong>
                    </span>
                    {h.templateCategory && (
                      <span>
                        Outreach Template: <strong>{h.templateCategory}</strong>
                      </span>
                    )}
                    {h.templateName && (
                      <span>
                        Template: <strong>{h.templateName}</strong>
                      </span>
                    )}
                    {h.subject && h.channel === "email" && (
                      <span>
                        Subject: <strong>{h.subject}</strong>
                      </span>
                    )}
                  </div>

                  {h.messagePreview && (
                    <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      &quot;{h.messagePreview}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No follow-ups have been sent yet for this cadence. Use <strong>Continue Outreach</strong> to send the 1st follow-up.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {!isCompleted && onContinueOutreach && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onContinueOutreach();
              }}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="font-bold"
            >
              Send {currentStep === 1 ? "1st Follow-up" : "2nd Follow-up"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
