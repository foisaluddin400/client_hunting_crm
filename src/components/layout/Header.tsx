"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Plus,
  Compass,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCRM } from "@/lib/context/crm-context";
import { LeadStatusBadge } from "@/components/ui/Badge";

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads, followUps, userProfile, openAddLead, openLeadDetails } = useCRM();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current page title & description
  const getPageMeta = () => {
    if (pathname === "/") {
      return {
        title: "Dashboard",
        description: "Overview of your client hunting pipeline and outreach analytics",
      };
    }
    if (pathname.startsWith("/lead-finder")) {
      return {
        title: "Lead Finder",
        description: "Discover high-opportunity local businesses on the interactive map",
      };
    }
    if (pathname.startsWith("/leads")) {
      return {
        title: "Leads Management",
        description: "Organize, filter, and launch multi-channel outreach campaigns",
      };
    }
    if (pathname.startsWith("/follow-ups")) {
      return {
        title: "Follow-up Tasks",
        description: "Stay top-of-mind and never let an outreach conversation go cold",
      };
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Settings & SMTP",
        description: "Manage your agency profile, templates, and outbound email server",
      };
    }
    return { title: "LeadFlow CRM", description: "Outreach & Pipeline" };
  };

  const pageMeta = getPageMeta();

  // Filtered search results for quick jumper
  const searchResults = searchQuery.trim()
    ? leads
        .filter(
          (l) =>
            l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.ceoName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.niche.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const pendingCount = followUps.filter(
    (f) => f.status === "today" || f.status === "overdue"
  ).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {pageMeta.title}
          </h1>
          <p className="hidden md:block text-xs text-slate-400 font-medium truncate max-w-md">
            {pageMeta.description}
          </p>
        </div>
      </div>

      {/* Right: Universal Search, Notifications, CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <div ref={searchRef} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search leads, businesses..."
              className="w-36 sm:w-64 md:w-72 rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Leads Matching &quot;{searchQuery}&quot;</span>
                <span>{searchResults.length} found</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.length > 0 ? (
                  searchResults.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        openLeadDetails(lead.id);
                      }}
                      className="w-full text-left p-3 hover:bg-indigo-50/50 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                          {lead.businessName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lead.ceoName ? `${lead.ceoName} • ` : ""}
                          {lead.location}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <LeadStatusBadge status={lead.status} size="sm" />
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No leads found matching &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    router.push(`/leads?search=${encodeURIComponent(searchQuery)}`);
                  }}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  View full leads directory &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications & Alerts</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                  {pendingCount} Pending
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {followUps.slice(0, 4).map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-3 text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                      {fu.channel === "whatsapp" ? (
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Mail className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        Follow up with {fu.businessName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {fu.notes || fu.originalMessagePreview}
                      </p>
                      <span className="text-[10px] font-medium text-amber-600 mt-1 inline-block">
                        Due: {fu.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    router.push("/follow-ups");
                  }}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  View all follow-up tasks &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Add Lead */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => openAddLead()}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm font-semibold"
        >
          <span className="hidden sm:inline">Add Lead</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
}
