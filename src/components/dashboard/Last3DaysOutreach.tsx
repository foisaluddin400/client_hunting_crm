"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  Mail,
  MessageSquare,
  CalendarCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  RotateCcw,
} from "lucide-react";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import Link from "next/link";

interface SenderEmailBreakdown {
  newEmails: number;
  followUpEmails: number;
  total: number;
}

interface ChannelBreakdown {
  newCount: number;
  followUpCount: number;
  total: number;
}

interface DayStat {
  date: string;
  displayDate: string;
  weekday: string;
  isToday: boolean;
  isYesterday: boolean;

  emailsBySender: Record<string, SenderEmailBreakdown>;
  totalNewEmails: number;
  totalFollowUpEmails: number;
  totalEmails: number;

  whatsapp: ChannelBreakdown;
  facebook: ChannelBreakdown;
  linkedin: ChannelBreakdown;
  instagram: ChannelBreakdown;
  twitter: ChannelBreakdown;

  totalNewOutreach: number;
  totalFollowUps: number;
  totalSent: number;
}

export function Last3DaysOutreach() {
  const { senderGmails } = useCRM();
  const [days, setDays] = useState<DayStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLast3Days = useCallback(async () => {
    try {
      const res = await fetch(`/api/outreach/daily-stats?days=3`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.days)) {
          setDays(data.days);
        }
      }
    } catch (err) {
      console.error("Failed to load last 3 days outreach activity:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLast3Days();
  }, [fetchLast3Days]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">
              Last 3 Days Outreach Activity
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Bangladesh Time (UTC+6)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly separated counts: New/original outreach vs Follow-up messages
          </p>
        </div>

        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group self-start sm:self-auto"
        >
          <span>View Full Calendar</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 3 Days Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-20 bg-slate-200 rounded" />
              <div className="h-28 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {days.map((day) => {
            // Build rendered emails list ensuring all configured senders are represented
            const emailEntries = Object.entries(day.emailsBySender || {});
            const senderMap = new Map<string, SenderEmailBreakdown>();

            for (const [sender, item] of emailEntries) {
              senderMap.set(sender.toLowerCase().trim(), item);
            }

            // Ensure configured sender Gmails exist
            if (senderGmails.length > 0) {
              for (const g of senderGmails) {
                const norm = g.toLowerCase().trim();
                if (!senderMap.has(norm)) {
                  senderMap.set(norm, { newEmails: 0, followUpEmails: 0, total: 0 });
                }
              }
            } else if (senderMap.size === 0) {
              senderMap.set("Default Sender", { newEmails: 0, followUpEmails: 0, total: 0 });
            }

            const renderedEmails = Array.from(senderMap.entries());

            return (
              <div
                key={day.date}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  day.isToday
                    ? "bg-gradient-to-b from-indigo-50/40 via-white to-white border-indigo-200/90 shadow-xs ring-1 ring-indigo-500/10"
                    : "bg-white border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Day Header */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          day.isToday
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : day.isYesterday
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {day.isToday
                          ? "Today"
                          : day.isYesterday
                          ? "Yesterday"
                          : day.weekday || "Past Day"}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {day.displayDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {day.totalNewOutreach} New
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {day.totalFollowUps} Follow-ups
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Section: Strictly Separated By Sender Gmail */}
                <div className="py-3 border-b border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email (by Sender Gmail)</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {day.totalNewEmails} new • {day.totalFollowUpEmails} fu
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    {renderedEmails.map(([sender, breakdown]) => (
                      <div
                        key={sender}
                        className="py-1 border-b border-slate-200/50 last:border-0 text-xs"
                      >
                        <div className="font-mono text-[11px] font-semibold text-slate-800 truncate" title={sender}>
                          {sender}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px]">
                          <span className="text-blue-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <strong>{breakdown.newEmails}</strong> New Emails
                          </span>
                          <span className="text-amber-800 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <strong>{breakdown.followUpEmails}</strong> Follow-up Emails
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Platforms Section: Separated New vs Follow-ups */}
                <div className="pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Platform Counts</span>
                    <span className="font-normal text-[10px] text-slate-400">New vs Follow-up</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {/* WhatsApp */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                        <span className="font-medium">WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/60">
                          {day.whatsapp?.newCount ?? 0} New
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          {day.whatsapp?.followUpCount ?? 0} Follow-ups
                        </span>
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                        <span className="font-medium">Facebook</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/60">
                          {day.facebook?.newCount ?? 0} New
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          {day.facebook?.followUpCount ?? 0} Follow-ups
                        </span>
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                        <span className="font-medium">LinkedIn</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/60">
                          {day.linkedin?.newCount ?? 0} New
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          {day.linkedin?.followUpCount ?? 0} Follow-ups
                        </span>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                        <span className="font-medium">Instagram</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/60">
                          {day.instagram?.newCount ?? 0} New
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          {day.instagram?.followUpCount ?? 0} Follow-ups
                        </span>
                      </div>
                    </div>

                    {/* Twitter/X */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <TwitterXIcon className="w-3.5 h-3.5 text-slate-800" />
                        <span className="font-medium">Twitter/X</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-blue-700 font-bold bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/60">
                          {day.twitter?.newCount ?? 0} New
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          {day.twitter?.followUpCount ?? 0} Follow-ups
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
