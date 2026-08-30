"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Compass,
  Users,
  CalendarClock,
  StickyNote,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  LogOut,
  LogIn,
} from "lucide-react";
import { useCRM } from "@/lib/context/crm-context";

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { leads, followUps, userProfile, logout, isAuthenticated } = useCRM();

  // Badge counts
  const leadsCount = leads.length;
  const pendingFollowUps = followUps.filter(
    (f) => f.status === "today" || f.status === "overdue"
  ).length;

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      name: "Lead Finder",
      href: "/lead-finder",
      icon: Compass,
      badge: "Discovery",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      name: "Leads",
      href: "/leads",
      icon: Users,
      badge: leadsCount > 0 ? leadsCount.toString() : undefined,
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      name: "Follow-ups",
      href: "/follow-ups",
      icon: CalendarClock,
      badge: pendingFollowUps > 0 ? pendingFollowUps.toString() : undefined,
      badgeColor:
        pendingFollowUps > 0
          ? "bg-rose-100 text-rose-700 font-bold animate-pulse"
          : "bg-slate-100 text-slate-700",
    },
    {
      name: "Notes",
      href: "/notes",
      icon: StickyNote,
      badge: undefined,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: undefined,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden animate-in fade-in"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 shadow-xs select-none",
          // Mobile state
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          // Desktop collapse state
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 bg-white">
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    LeadFlow
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    CRM
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Outreach & Pipeline
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all relative group",
                  isActive
                    ? "bg-indigo-50/80 text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-700"
                  )}
                />

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border border-transparent shrink-0",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Pro Outreach Quick Tip Card (when expanded) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100/80 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
              <span>Multi-Channel Pro</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Connect via WhatsApp, Email & LinkedIn in 1 click.
            </p>
          </div>
        )}

        {/* User Profile / Workspace at Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40">
          <div
            className={cn(
              "flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 transition-colors group",
              isCollapsed && "justify-center p-1"
            )}
          >
            <Link
              href="/settings"
              onClick={onMobileClose}
              className="flex items-center gap-3 min-w-0 flex-1"
              title={`${userProfile.name} • ${userProfile.agencyName}`}
            >
              <div className="relative shrink-0">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-200"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {userProfile.name}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {userProfile.agencyName}
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
