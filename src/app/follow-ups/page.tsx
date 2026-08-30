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
} from "lucide-react";

export default function FollowUpsPage() {
  const { followUps, leads, openAddLead } = useCRM();

  const [activeTab, setActiveTab] = useState<string>("today");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Group all follow-ups and outreach activities strictly by unique leadId
  const groupedLeads: GroupedFollowUpLead[] = useMemo(() => {
    const leadMap = new Map<string, Lead>();
    for (const l of leads) {
      leadMap.set(l.id, l);
    }

    // Map keyed by unique leadId
    const groupsMap = new Map<
      string,
      {
        leadId: string;
        lead?: Lead;
        businessName: string;
        contactPerson: string;
        followUpItems: FollowUpItem[];
      }
    >();

    for (const fu of followUps) {
      const leadId = fu.leadId;
      const lead = leadMap.get(leadId);

      if (!groupsMap.has(leadId)) {
        groupsMap.set(leadId, {
          leadId,
          lead,
          businessName: lead?.businessName || fu.businessName || "Unknown Business",
          contactPerson:
            lead?.ceoName || fu.contactPerson || lead?.businessName || fu.businessName,
          followUpItems: [],
        });
      }

      const group = groupsMap.get(leadId)!;
      group.followUpItems.push(fu);
    }

    const result: GroupedFollowUpLead[] = [];

    for (const [leadId, group] of groupsMap.entries()) {
      const lead = group.lead;
      const activitiesMap = new Map<string, GroupedFollowUpActivity>();

      // 1. Gather all outreach activities from lead.activities
      if (lead?.activities && lead.activities.length > 0) {
        for (const act of lead.activities) {
          const ch = (act.channel as string).toLowerCase() as Channel;
          const key = `${ch}-${act.date}-${(act.messagePreview || "").substring(0, 30)}`;
          activitiesMap.set(key, {
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

      // 2. Gather follow-up items
      for (const fu of group.followUpItems) {
        const ch = (fu.channel as string).toLowerCase() as Channel;
        const key = `${ch}-${fu.dueDate}-${(fu.originalMessagePreview || "").substring(0, 30)}`;
        if (!activitiesMap.has(key)) {
          activitiesMap.set(key, {
            id: fu.id,
            channel: ch,
            messagePreview: fu.originalMessagePreview,
            date: fu.dueDate,
            time: fu.dueTime,
            status: fu.status === "completed" ? "Completed" : "Scheduled",
            notes: fu.notes,
          });
        } else {
          const existing = activitiesMap.get(key)!;
          if (fu.notes && !existing.notes) {
            existing.notes = fu.notes;
          }
        }
      }

      const activitiesList = Array.from(activitiesMap.values());

      // Compute overall status for the lead:
      // Overdue > Today > Upcoming > Completed
      const statuses = group.followUpItems.map((f) => f.status);
      let overallStatus: "today" | "upcoming" | "overdue" | "completed" = "upcoming";

      if (statuses.includes("overdue")) {
        overallStatus = "overdue";
      } else if (statuses.includes("today")) {
        overallStatus = "today";
      } else if (statuses.includes("upcoming")) {
        overallStatus = "upcoming";
      } else if (statuses.length > 0 && statuses.every((s) => s === "completed")) {
        overallStatus = "completed";
      }

      // Compute highest priority:
      // High > Medium > Low
      const priorities = group.followUpItems.map((f) => f.priority);
      let highestPriority: Priority = "medium";
      if (priorities.includes("high")) highestPriority = "high";
      else if (priorities.includes("medium")) highestPriority = "medium";
      else if (priorities.includes("low")) highestPriority = "low";

      // Primary follow-up item
      const activeFollowUps = group.followUpItems.filter(
        (f) => f.status !== "completed"
      );
      const primaryFollowUp = activeFollowUps[0] || group.followUpItems[0] || {
        id: `fu-${leadId}`,
        leadId,
        businessName: group.businessName,
        contactPerson: group.contactPerson,
        channel: "email" as Channel,
        originalMessagePreview: "",
        dueDate: new Date().toISOString().split("T")[0],
        status: overallStatus,
        priority: highestPriority,
      };

      result.push({
        leadId,
        businessName: group.businessName,
        contactPerson: group.contactPerson,
        lead,
        primaryFollowUp,
        followUpItems: group.followUpItems,
        activities: activitiesList,
        status: overallStatus,
        priority: highestPriority,
        dueDate: primaryFollowUp.dueDate || new Date().toISOString().split("T")[0],
        dueTime: primaryFollowUp.dueTime,
        completedAt: group.followUpItems.find((f) => f.completedAt)?.completedAt,
      });
    }

    return result;
  }, [followUps, leads]);

  // Counts calculated strictly per unique lead/contact
  const todayCount = groupedLeads.filter((g) => g.status === "today").length;
  const upcomingCount = groupedLeads.filter((g) => g.status === "upcoming").length;
  const overdueCount = groupedLeads.filter((g) => g.status === "overdue").length;
  const completedCount = groupedLeads.filter((g) => g.status === "completed").length;

  // Tabs
  const tabItems = [
    { id: "today", label: "Due Today", count: todayCount },
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "overdue", label: "Overdue", count: overdueCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "all", label: "All Tasks", count: groupedLeads.length },
  ];

  // Filtered List
  const filteredList = useMemo(() => {
    return groupedLeads.filter((item) => {
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
        const matchesActivity = item.activities.some(
          (a) =>
            a.channel.toLowerCase().includes(q) ||
            a.messagePreview?.toLowerCase().includes(q) ||
            a.notes?.toLowerCase().includes(q)
        );
        if (!matchesBusiness && !matchesContact && !matchesActivity) {
          return false;
        }
      }

      return true;
    });
  }, [groupedLeads, activeTab, priorityFilter, searchQuery]);

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
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track multi-touch cadences, eliminate dropped leads, and stay top-of-mind
          </p>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
            variant="pill"
          />

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <FollowUpCard key={item.leadId} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6 text-emerald-600" />}
          title="You're all caught up! ✨"
          description={
            activeTab === "today"
              ? "No follow-up tasks due today. All your client communication is up to date."
              : "No follow-up tasks found matching your filter."
          }
          actionLabel="View All Leads"
          onAction={() => window.location.assign("/leads")}
        />
      )}
    </div>
  );
}
