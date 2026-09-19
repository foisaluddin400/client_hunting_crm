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
  TrendingUp,
} from "lucide-react";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import Link from "next/link";

interface DayStat {
  date: string;
  displayDate: string;
  weekday: string;
  isToday: boolean;
  isYesterday: boolean;
  emailsBySender: Record<string, number>;
  totalEmails: number;
  whatsappCount: number;
  facebookCount: number;
  linkedinCount: number;
  instagramCount: number;
  twitterCount: number;
  followUpsCount: number;
  totalSent: number;
}

export function Last3DaysOutreach() {
  const { senderGmails } = useCRM();
  const [days, setDays] = useState<DayStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLast3Days = useCallback(async () => {
    try {
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/outreach/daily-stats?days=3&tzOffset=${tzOffset}`);
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
              Last 3 Days Outreach
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
              Live Activity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Actual sent outreach & follow-up messages across platforms
          </p>
        </div>

        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group self-start sm:self-auto"
        >
          <span>View All in Calendar</span>
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
              <div className="h-16 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {days.map((day) => {
            // Get emails list by sender
            const emailEntries = Object.entries(day.emailsBySender || {});
            // If user has configured senderGmails, ensure they are represented
            const renderedEmails =
              emailEntries.length > 0
                ? emailEntries
                : senderGmails.length > 0
                ? senderGmails.map((g) => [g, 0] as [string, number])
                : [["No sender configured", 0] as [string, number]];

            return (
              <div
                key={day.date}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  day.isToday
                    ? "bg-gradient-to-b from-indigo-50/40 via-white to-white border-indigo-200/80 shadow-xs ring-1 ring-indigo-500/10"
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
                      <span className="text-xs text-slate-500 font-medium">
                        {day.displayDate}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {day.totalSent} {day.totalSent === 1 ? "action" : "actions"}
                    </span>
                  </div>
                </div>

                {/* Email Section (Separated by actual Sender Gmail Account) */}
                <div className="py-3 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Outreach</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                      Total: {day.totalEmails}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    {renderedEmails.map(([sender, count]) => (
                      <div
                        key={sender}
                        className="flex items-center justify-between text-[11px] font-mono py-0.5 text-slate-700"
                      >
                        <span className="truncate max-w-[170px]" title={sender}>
                          {sender}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          — {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Platforms & Follow-ups Totals */}
                <div className="pt-3 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Platform Totals
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {/* WhatsApp */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MessageSquare className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {day.whatsappCount}
                      </span>
                    </div>

                    {/* Facebook */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <FacebookIcon className="w-3 h-3 text-[#1877F2]" />
                        <span>Facebook</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {day.facebookCount}
                      </span>
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <LinkedinIcon className="w-3 h-3 text-[#0A66C2]" />
                        <span>LinkedIn</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {day.linkedinCount}
                      </span>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <InstagramIcon className="w-3 h-3 text-[#E1306C]" />
                        <span>Instagram</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {day.instagramCount}
                      </span>
                    </div>

                    {/* Twitter/X */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <TwitterXIcon className="w-3 h-3 text-slate-800" />
                        <span>Twitter/X</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {day.twitterCount}
                      </span>
                    </div>

                    {/* Follow-ups */}
                    <div className="flex items-center justify-between p-1.5 rounded-md bg-amber-50/70 border border-amber-200/60">
                      <div className="flex items-center gap-1 text-amber-900 font-medium">
                        <CalendarCheck className="w-3 h-3 text-amber-600" />
                        <span>Follow-ups</span>
                      </div>
                      <span className="font-bold text-amber-900">
                        {day.followUpsCount}
                      </span>
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
