"use client";

import React, { useState, useMemo } from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  FollowUpCard,
  GroupedFollowUpLead,
  GroupedFollowUpActivity,
} from "@/components/follow-ups/FollowUpCard";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Channel, Priority, Lead, FollowUpItem } from "@/lib/types";
import {
  CalendarClock,
  CalendarCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  Search,
  Filter,
  Layers,
} from "lucide-react";

export default function FollowUpsPage() {
  const { followUps, leads } = useCRM();

  const [activeTab, setActiveTab] = useState<string>("today");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Group all follow-ups and outreach activities strictly by unique (leadId, channel)
  // Ensures Email, WhatsApp, Facebook, LinkedIn, Instagram, Twitter/X are completely independent
  const groupedLeads: GroupedFollowUpLead[] = useMemo(() => {
    const leadMap = new Map<string, Lead>();
    for (const l of leads) {
      leadMap.set(l.id, l);
    }

    const groupsMap = new Map<string, GroupedFollowUpLead>();

    for (const fu of followUps) {
      const ch = ((fu.channel || "email").toLowerCase() as Channel) || "email";
      const groupKey = `${fu.leadId}_${ch}`;
      const lead = leadMap.get(fu.leadId);

      const businessName = lead?.businessName || fu.businessName || "Unknown Business";
      const contactPerson =
        lead?.ceoName || fu.contactPerson || lead?.businessName || fu.businessName || "Contact";

      // Platform-specific activities from lead.activities
      const activitiesList: GroupedFollowUpActivity[] = [];
      if (lead?.activities && lead.activities.length > 0) {
        for (const act of lead.activities) {
          if ((act.channel as string).toLowerCase() === ch) {
            activitiesList.push({
              id: act.id,
              channel: ch,
              type: act.type,
              messagePreview: act.messagePreview || act.fullMessage || act.type,
              date: act.date,
              time: act.time,
              status: act.status || "Sent",
            });
          }
        }
      }

      // Merge follow-up history entries if not already represented
      if (fu.history && fu.history.length > 0) {
        for (const h of fu.history) {
          const date = h.sentDate || h.scheduledDate || "";
          if (!activitiesList.some((a) => a.date === date)) {
            activitiesList.push({
              id: h.id || `h-${h.followUpNumber}`,
              channel: ch,
              type: `${ch.toUpperCase()} ${h.followUpNumber === 1 ? "1st" : "2nd"} Follow-up`,
              messagePreview: h.messagePreview,
              date: date,
              status: h.sentAt ? "Sent" : "Scheduled",
              notes: h.notes,
            });
          }
        }
      }

      const currentStep = fu.currentStep ?? (fu.status === "completed" ? 3 : 1);

      groupsMap.set(groupKey, {
        groupKey,
        leadId: fu.leadId,
        businessName,
        contactPerson,
        lead,
        channel: ch,
        followUp: fu,
        primaryFollowUp: fu,
        followUpItems: [fu],
        activities: activitiesList,
        status: fu.status,
        priority: fu.priority,
        dueDate: fu.dueDate,
        dueTime: fu.dueTime,
        completedAt: fu.completedAt,
        currentStep,
        intervalDays: fu.intervalDays,
        templateCategory: fu.templateCategory,
        templateName: fu.templateName,
        subject: fu.subject,
        isRescheduled: fu.isRescheduled,
        rescheduleNotice: fu.rescheduleNotice,
        history: fu.history,
        firstFollowUpScheduledAt: fu.firstFollowUpScheduledAt,
        firstFollowUpSentAt: fu.firstFollowUpSentAt,
        secondFollowUpScheduledAt: fu.secondFollowUpScheduledAt,
        secondFollowUpSentAt: fu.secondFollowUpSentAt,
      });
    }

    return Array.from(groupsMap.values());
  }, [followUps, leads]);

  // Counts calculated dynamically according to selected platform filter
  const platformFilteredGroup = useMemo(() => {
    if (platformFilter === "all") return groupedLeads;
    return groupedLeads.filter((g) => g.channel === platformFilter);
  }, [groupedLeads, platformFilter]);

  const todayCount = platformFilteredGroup.filter((g) => g.status === "today").length;
  const upcomingCount = platformFilteredGroup.filter((g) => g.status === "upcoming").length;
  const overdueCount = platformFilteredGroup.filter((g) => g.status === "overdue").length;
  const completedCount = platformFilteredGroup.filter((g) => g.status === "completed").length;
  const allCount = platformFilteredGroup.length;

  // Tabs matching prompt requirements: Due Today, Upcoming, Overdue, Completed, All Data
  const tabItems = [
    { id: "today", label: "Due Today", count: todayCount },
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "overdue", label: "Overdue", count: overdueCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "all", label: "All Data", count: allCount },
  ];

  // Filtered List based on Active Tab, Priority, and Search Query
  const filteredList = useMemo(() => {
    return platformFilteredGroup.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBusiness = item.businessName.toLowerCase().includes(q);
        const matchesContact = item.contactPerson.toLowerCase().includes(q);
        const matchesTemplate =
          item.templateName?.toLowerCase().includes(q) ||
          item.templateCategory?.toLowerCase().includes(q);
        const matchesSubject = item.subject?.toLowerCase().includes(q);
        const matchesNotes = item.followUp.notes?.toLowerCase().includes(q);
        const matchesPreview = item.followUp.originalMessagePreview?.toLowerCase().includes(q);
        const matchesActivity = item.activities.some(
          (a) =>
            a.channel.toLowerCase().includes(q) ||
            a.messagePreview?.toLowerCase().includes(q) ||
            a.notes?.toLowerCase().includes(q)
        );
        if (
          !matchesBusiness &&
          !matchesContact &&
          !matchesTemplate &&
          !matchesSubject &&
          !matchesNotes &&
          !matchesPreview &&
          !matchesActivity
        ) {
          return false;
        }
      }

      return true;
    });
  }, [platformFilteredGroup, activeTab, priorityFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Follow-up Engine
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              {todayCount + overdueCount} Action Required
            </span>
            {platformFilter !== "all" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 capitalize">
                {platformFilter} only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track multi-touch cadences, eliminate dropped leads, and stay top-of-mind across platforms
          </p>
        </div>
      </div>

      {/* Top 4 Summary Cards — Dynamic counts based on platform filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("today")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Due Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {todayCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            Immediate attention required
          </span>
        </div>

        <div
          onClick={() => setActiveTab("upcoming")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Upcoming
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {upcomingCount}
          </div>
          <span className="text-[11px] text-indigo-700 font-medium">
            Scheduled for later this week
          </span>
        </div>

        <div
          onClick={() => setActiveTab("overdue")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "overdue"
              ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Overdue
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {overdueCount}
          </div>
          <span className="text-[11px] text-rose-700 font-medium">
            Past scheduled outreach date
          </span>
        </div>

        <div
          onClick={() => setActiveTab("completed")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "completed"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {completedCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">
            Follow-up cadences finished
          </span>
        </div>
      </div>

      {/* Filter and Switcher Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
            variant="pill"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks, templates, subjects..."
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            {/* Platform Filter Dropdown */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter by Platform"
            >
              <option value="all">All Platforms</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter / X</option>
            </select>

            {/* Priority Filter Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Filter by Priority"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <FollowUpCard key={item.groupKey} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6 text-emerald-600" />}
          title="You're all caught up! ✨"
          description={
            activeTab === "today"
              ? "No follow-up tasks due today. All your client communication is up to date."
              : `No follow-up tasks found matching your filter${platformFilter !== "all" ? ` for ${platformFilter}` : ""}.`
          }
          actionLabel="View All Leads"
          onAction={() => window.location.assign("/leads")}
        />
      )}
    </div>
  );
}
