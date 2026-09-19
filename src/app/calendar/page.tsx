"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  CalendarCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
  CalendarDays,
  Send,
  RotateCcw,
} from "lucide-react";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import {
  toDhakaDateString,
  getDhakaTodayDateString,
  formatDate,
  formatEnglishDate,
  formatTime,
} from "@/lib/date-utils";

interface ActivityItem {
  id: string;
  channel: string;
  senderEmail?: string;
  businessName: string;
  leadId?: string;
  time?: string;
  type?: string;
  isFollowUp?: boolean;
}

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
  date: string; // "YYYY-MM-DD" in Asia/Dhaka
  displayDate: string; // "Sep 19, 2026" in Asia/Dhaka
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

  // Backwards-compatible fields
  whatsappCount?: number;
  facebookCount?: number;
  linkedinCount?: number;
  instagramCount?: number;
  twitterCount?: number;
  followUpsCount?: number;

  activities: ActivityItem[];
}

export default function CalendarPage() {
  const { senderGmails } = useCRM();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [dateMap, setDateMap] = useState<Record<string, DayStat>>({});
  const [allActiveDays, setAllActiveDays] = useState<DayStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all historical outreach data from existing records
  const fetchAllStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/outreach/daily-stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.dateMap) {
          setDateMap(data.dateMap);
        }
        if (Array.isArray(data.days)) {
          setAllActiveDays(data.days);
        }
        if (!selectedDateStr && data.todayDate) {
          setSelectedDateStr(data.todayDate);
        }
      }
    } catch (err) {
      console.error("Failed to load historical outreach stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateStr]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // Set today as initial selection if none chosen yet
  useEffect(() => {
    if (!selectedDateStr) {
      const todayStr = getDhakaTodayDateString();
      setSelectedDateStr(todayStr);
    }
  }, [selectedDateStr]);

  // Month and Year navigation state
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getDhakaTodayDateString());
  };

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  // Generate calendar days for the current view
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      hasData: boolean;
      totalSent: number;
      newOutreach: number;
      followUps: number;
    }> = [];

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const stat = dateMap[dateStr];
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        hasData: Boolean(stat && stat.totalSent > 0),
        totalSent: stat?.totalSent || 0,
        newOutreach: stat?.totalNewOutreach || 0,
        followUps: stat?.totalFollowUps || 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curM = currentMonth + 1;
      const dateStr = `${currentYear}-${String(curM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const stat = dateMap[dateStr];
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        hasData: Boolean(stat && stat.totalSent > 0),
        totalSent: stat?.totalSent || 0,
        newOutreach: stat?.totalNewOutreach || 0,
        followUps: stat?.totalFollowUps || 0,
      });
    }

    // Next month filler days to complete grid (up to 35 or 42)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const stat = dateMap[dateStr];
      cells.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        hasData: Boolean(stat && stat.totalSent > 0),
        totalSent: stat?.totalSent || 0,
        newOutreach: stat?.totalNewOutreach || 0,
        followUps: stat?.totalFollowUps || 0,
      });
    }

    return cells;
  }, [currentYear, currentMonth, dateMap]);

  // Selected Day Data
  const selectedDayData: DayStat = useMemo(() => {
    if (selectedDateStr && dateMap[selectedDateStr]) {
      return dateMap[selectedDateStr];
    }

    // Default empty day structure
    let displayDate = selectedDateStr;
    let weekday = "";
    if (selectedDateStr) {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      if (y && m && d) {
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        displayDate = formatDate(dt);
        weekday = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          weekday: "long",
        }).format(dt);
      }
    }

    const emailSenders: Record<string, SenderEmailBreakdown> = {};
    for (const g of senderGmails) {
      emailSenders[g] = { newEmails: 0, followUpEmails: 0, total: 0 };
    }

    return {
      date: selectedDateStr,
      displayDate,
      weekday,
      isToday: false,
      isYesterday: false,
      emailsBySender: emailSenders,
      totalNewEmails: 0,
      totalFollowUpEmails: 0,
      totalEmails: 0,
      whatsapp: { newCount: 0, followUpCount: 0, total: 0 },
      facebook: { newCount: 0, followUpCount: 0, total: 0 },
      linkedin: { newCount: 0, followUpCount: 0, total: 0 },
      instagram: { newCount: 0, followUpCount: 0, total: 0 },
      twitter: { newCount: 0, followUpCount: 0, total: 0 },
      totalNewOutreach: 0,
      totalFollowUps: 0,
      totalSent: 0,
      activities: [],
    };
  }, [selectedDateStr, dateMap, senderGmails]);

  // Formatted date string for header
  const formattedSelectedFullDate = useMemo(() => {
    if (!selectedDateStr) return "Select a date";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(dt);
  }, [selectedDateStr]);

  // Emails list by sender for selected date
  const selectedEmailsBySender = useMemo(() => {
    const raw = selectedDayData.emailsBySender || {};
    const entries = Object.entries(raw);
    const senderMap = new Map<string, SenderEmailBreakdown>();

    for (const [sender, val] of entries) {
      senderMap.set(sender.toLowerCase().trim(), val);
    }

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

    return Array.from(senderMap.entries());
  }, [selectedDayData, senderGmails]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Activity Calendar
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Bangladesh Time (UTC+6)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View actual sent outreach and follow-up records across all historical dates
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs font-semibold"
          >
            Today
          </Button>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
              {monthName} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on Left (7 cols), Selected Day Summary on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {monthName} {currentYear}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Click any date to view activity
            </span>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === getDhakaTodayDateString();

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`relative min-h-[64px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                    isSelected
                      ? "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/50 shadow-xs z-10"
                      : isToday
                      ? "border-indigo-300 bg-indigo-50/20 font-bold"
                      : cell.isCurrentMonth
                      ? cell.hasData
                        ? "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-100/50"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      : "border-transparent text-slate-300 opacity-40 hover:opacity-80"
                  }`}
                >
                  {/* Day Number and Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs ${
                        isSelected
                          ? "font-extrabold text-indigo-700"
                          : isToday
                          ? "font-extrabold text-indigo-600"
                          : cell.isCurrentMonth
                          ? "font-semibold text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </div>

                  {/* Activity Indicators on Calendar Cell */}
                  {cell.hasData && (
                    <div className="space-y-0.5 mt-1">
                      {cell.newOutreach > 0 && (
                        <div className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800 truncate">
                          {cell.newOutreach} New
                        </div>
                      )}
                      {cell.followUps > 0 && (
                        <div className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 truncate">
                          {cell.followUps} FU
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend and Active Dates count */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span>New Outreach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>Follow-ups</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              {allActiveDays.length} active dates recorded
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
          {/* Header for Selected Date */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selected Date
                </span>
                {selectedDayData.isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Today
                  </span>
                )}
                {selectedDayData.isYesterday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white">
                    Yesterday
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-slate-900 mt-0.5">
                {formattedSelectedFullDate}
              </h3>
            </div>

            {/* Separated Totals Badge */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {selectedDayData.totalNewOutreach} New Outreach
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {selectedDayData.totalFollowUps} Follow-ups
              </span>
            </div>
          </div>

          {/* Email Count by Sender Gmail Account: Strictly Separated */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email: By Sender Gmail</span>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                {selectedDayData.totalNewEmails} new • {selectedDayData.totalFollowUpEmails} fu
              </span>
            </div>

            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-blue-100/80">
              {selectedEmailsBySender.map(([sender, breakdown]) => (
                <div
                  key={sender}
                  className="py-1.5 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div className="font-mono text-xs font-semibold text-slate-800 truncate" title={sender}>
                    {sender}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <span className="text-blue-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <strong>{breakdown.newEmails}</strong> New Emails
                    </span>
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <strong>{breakdown.followUpEmails}</strong> Follow-up Emails
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms Totals: Strictly Separated */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Social Platforms Sent Counts
            </h4>

            <div className="space-y-1.5 text-xs">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  <span className="font-semibold">WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedDayData.whatsapp?.newCount ?? 0} New
                  </span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDayData.whatsapp?.followUpCount ?? 0} Follow-ups
                  </span>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span className="font-semibold">Facebook</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedDayData.facebook?.newCount ?? 0} New
                  </span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDayData.facebook?.followUpCount ?? 0} Follow-ups
                  </span>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span className="font-semibold">LinkedIn</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedDayData.linkedin?.newCount ?? 0} New
                  </span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDayData.linkedin?.followUpCount ?? 0} Follow-ups
                  </span>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                  <span className="font-semibold">Instagram</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedDayData.instagram?.newCount ?? 0} New
                  </span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDayData.instagram?.followUpCount ?? 0} Follow-ups
                  </span>
                </div>
              </div>

              {/* Twitter / X */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <TwitterXIcon className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-semibold">Twitter/X</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedDayData.twitter?.newCount ?? 0} New
                  </span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedDayData.twitter?.followUpCount ?? 0} Follow-ups
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activities List for Clicked Day */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Messages & Follow-ups Sent on this Day</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedDayData.activities.length} logged
              </span>
            </div>

            {selectedDayData.activities.length > 0 ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedDayData.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 truncate">
                        {act.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize font-medium">{act.channel}</span>
                        {act.isFollowUp ? (
                          <span className="text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            Follow-up
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-100/90 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            New
                          </span>
                        )}
                        {act.senderEmail && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            via {act.senderEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {act.time && (
                      <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                        {act.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 text-center text-xs text-slate-400">
                No outreach or follow-ups were sent on this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
