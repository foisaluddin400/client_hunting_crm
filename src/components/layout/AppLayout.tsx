"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OutreachModal } from "@/components/outreach/OutreachModal";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { LeadDetailsDrawer } from "@/components/leads/LeadDetailsDrawer";
import { DeleteConfirmModal } from "@/components/leads/DeleteConfirmModal";
import { RescheduleModal } from "@/components/follow-ups/RescheduleModal";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If on an auth page, render without dashboard shell
  const isAuthPage = AUTH_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <OutreachModal />
      <AddLeadModal />
      <LeadDetailsDrawer />
      <DeleteConfirmModal />
      <RescheduleModal />
    </div>
  );
}
