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
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
} from "lucide-react";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

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

interface DayStat {
  date: string; // "YYYY-MM-DD"
  displayDate: string; // "Sep 19, 2026"
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
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/outreach/daily-stats?tzOffset=${tzOffset}`);
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
      console.error("Failed to load calendar daily stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateStr]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // If selectedDateStr not set initially, default to today in YYYY-MM-DD
  useEffect(() => {
    if (!selectedDateStr) {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const da = String(now.getDate()).padStart(2, "0");
      setSelectedDateStr(`${yr}-${mo}-${da}`);
    }
  }, [selectedDateStr]);

  // Calendar month calculation
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const da = String(now.getDate()).padStart(2, "0");
    setSelectedDateStr(`${yr}-${mo}-${da}`);
  };

  // Build grid of days for current month view
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun, 6=Sat
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, prevDay);
      const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
      cells.push({
        dateStr: prevDateStr,
        dayNumber: prevDay,
        isCurrentMonth: false,
        isToday: prevDateStr === todayDateStr,
      });
    }

    // Current month cells
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr,
      });
    }

    // Next month padding cells to complete 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        dateStr: nextDateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: nextDateStr === todayDateStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

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
        const dt = new Date(y, m - 1, d);
        displayDate = dt.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        weekday = dt.toLocaleDateString("en-US", { weekday: "long" });
      }
    }

    const emailSenders: Record<string, number> = {};
    for (const g of senderGmails) {
      emailSenders[g] = 0;
    }

    return {
      date: selectedDateStr,
      displayDate,
      weekday,
      isToday: false,
      isYesterday: false,
      emailsBySender: emailSenders,
      totalEmails: 0,
      whatsappCount: 0,
      facebookCount: 0,
      linkedinCount: 0,
      instagramCount: 0,
      twitterCount: 0,
      followUpsCount: 0,
      totalSent: 0,
      activities: [],
    };
  }, [selectedDateStr, dateMap, senderGmails]);

  // Formatted date string for header
  const formattedSelectedFullDate = useMemo(() => {
    if (!selectedDateStr) return "Select a date";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDateStr]);

  // Emails list by sender for selected date
  const selectedEmailsBySender = useMemo(() => {
    const raw = selectedDayData.emailsBySender || {};
    const entries = Object.entries(raw);

    // If sender accounts configured in Settings, ensure all configured accounts are displayed
    if (senderGmails.length > 0) {
      const result: Array<[string, number]> = [];
      const seen = new Set<string>();

      for (const g of senderGmails) {
        const count = raw[g.toLowerCase().trim()] ?? 0;
        result.push([g, count]);
        seen.add(g.toLowerCase().trim());
      }

      for (const [sender, count] of entries) {
        if (!seen.has(sender.toLowerCase().trim())) {
          result.push([sender, count]);
        }
      }

      return result;
    }

    return entries.length > 0
      ? entries
      : ([["No sender accounts configured in Settings", 0]] as Array<[string, number]>);
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Historical Timeline
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

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              const dayStat = dateMap[cell.dateStr];
              const hasActivity = dayStat && dayStat.totalSent > 0;
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr);
                    // If clicked date belongs to prev/next month, jump calendar to it
                    const [y, m] = cell.dateStr.split("-").map(Number);
                    if (y !== currentYear || m - 1 !== currentMonth) {
                      setCurrentDate(new Date(y, m - 1, 1));
                    }
                  }}
                  className={`min-h-[72px] sm:min-h-[80px] p-2 rounded-xl text-left border flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs"
                      : cell.isToday
                      ? "bg-slate-50/80 border-indigo-300 font-semibold"
                      : cell.isCurrentMonth
                      ? "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50"
                      : "bg-slate-50/30 border-slate-100 text-slate-300 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? "text-indigo-700"
                          : cell.isToday
                          ? "text-indigo-600 font-extrabold"
                          : cell.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </div>

                  {/* Activity Badge if sent actions exist on this date */}
                  {hasActivity ? (
                    <div className="mt-1 space-y-1 w-full">
                      <div className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100/80 text-indigo-800 truncate max-w-full">
                        {dayStat.totalSent} sent
                      </div>
                      {/* Channel indicator dots */}
                      <div className="flex items-center gap-1">
                        {dayStat.totalEmails > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                            title={`${dayStat.totalEmails} email(s)`}
                          />
                        )}
                        {dayStat.whatsappCount > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title={`${dayStat.whatsappCount} whatsapp`}
                          />
                        )}
                        {dayStat.followUpsCount > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            title={`${dayStat.followUpsCount} follow-up(s)`}
                          />
                        )}
                        {(dayStat.linkedinCount > 0 ||
                          dayStat.facebookCount > 0 ||
                          dayStat.instagramCount > 0 ||
                          dayStat.twitterCount > 0) && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-500"
                            title="Social outreach"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 select-none">
                      —
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Active Historical Dates Selector */}
          {allActiveDays.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-600 block">
                Historical Active Dates ({allActiveDays.length} available):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {allActiveDays.slice(0, 15).map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => {
                      setSelectedDateStr(d.date);
                      const [y, m] = d.date.split("-").map(Number);
                      setCurrentDate(new Date(y, m - 1, 1));
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      d.date === selectedDateStr
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {d.displayDate} ({d.totalSent})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Activity Card (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
          {/* Header */}
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Selected Day Breakdown
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {selectedDayData.totalSent}{" "}
                {selectedDayData.totalSent === 1 ? "Sent Action" : "Sent Actions"}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 pt-1">
              {formattedSelectedFullDate}
            </h3>
          </div>

          {/* Email Count by Sender Gmail Account (Prompt Requirement) */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email: By Sender Gmail</span>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Total: {selectedDayData.totalEmails}
              </span>
            </div>

            <div className="space-y-1 bg-white p-2.5 rounded-lg border border-blue-100/80">
              {selectedEmailsBySender.map(([sender, count]) => (
                <div
                  key={sender}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0 font-mono text-slate-800"
                >
                  <span className="truncate max-w-[200px]" title={sender}>
                    {sender}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0">
                    — {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms Totals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Existing Platforms Sent Totals
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedDayData.whatsappCount}
                </span>
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Facebook</span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedDayData.facebookCount}
                </span>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>LinkedIn</span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedDayData.linkedinCount}
                </span>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                  <span>Instagram</span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedDayData.instagramCount}
                </span>
              </div>

              {/* Twitter / X */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <TwitterXIcon className="w-3.5 h-3.5 text-slate-800" />
                  <span>Twitter/X</span>
                </div>
                <span className="font-bold text-slate-900">
                  {selectedDayData.twitterCount}
                </span>
              </div>

              {/* Follow-ups sent */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/80 border border-amber-200/70">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Follow-ups</span>
                </div>
                <span className="font-bold text-amber-900">
                  {selectedDayData.followUpsCount}
                </span>
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
                    className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 truncate">
                        {act.businessName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                        <span className="capitalize">{act.channel}</span>
                        {act.isFollowUp && (
                          <span className="text-amber-700 bg-amber-100/80 px-1 rounded text-[10px] font-bold">
                            Follow-up
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
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
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
