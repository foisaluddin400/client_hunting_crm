"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCRM } from "@/lib/context/crm-context";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadTable } from "@/components/leads/LeadTable";
import { Button } from "@/components/ui/Button";
import { LeadFiltersState, LeadStatus, WebsiteStatus, Channel } from "@/lib/types";
import { exportLeadsToCSV } from "@/lib/utils";
import {
  Plus,
  Download,
  Users,
  Compass,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";

function LeadsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = (searchParams.get("status") as LeadStatus) || "all";

  const { leads, openAddLead } = useCRM();

  const [filters, setFilters] = useState<LeadFiltersState>({
    search: initialSearch,
    websiteStatus: "all",
    leadStatus: initialStatus,
    niche: "",
    location: "",
    channel: "all",
    dateAdded: "",
  });

  const handleFilterChange = (updates: Partial<LeadFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      websiteStatus: "all",
      leadStatus: "all",
      niche: "",
      location: "",
      channel: "all",
      dateAdded: "",
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = lead.businessName.toLowerCase().includes(q);
        const matchesCeo = lead.ceoName?.toLowerCase().includes(q);
        const matchesEmail = lead.email?.toLowerCase().includes(q);
        const matchesLocation = lead.location.toLowerCase().includes(q);
        if (!matchesName && !matchesCeo && !matchesEmail && !matchesLocation) {
          return false;
        }
      }

      // Website status
      if (
        filters.websiteStatus !== "all" &&
        lead.websiteStatus !== filters.websiteStatus
      ) {
        return false;
      }

      // Lead status
      if (filters.leadStatus !== "all" && lead.status !== filters.leadStatus) {
        return false;
      }

      // Niche
      if (filters.niche && lead.niche !== filters.niche) {
        return false;
      }

      // Location
      if (
        filters.location &&
        !lead.location.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      // Channel
      if (filters.channel !== "all") {
        if (filters.channel === "email" && !lead.email) return false;
        if (
          filters.channel === "whatsapp" &&
          !lead.whatsapp &&
          !lead.phone
        )
          return false;
        if (filters.channel === "linkedin" && !lead.linkedin) return false;
        if (filters.channel === "instagram" && !lead.instagram) return false;
        if (filters.channel === "facebook" && !lead.facebook) return false;
        if (filters.channel === "twitter" && !lead.twitter) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.websiteStatus !== "all") count++;
    if (filters.leadStatus !== "all") count++;
    if (filters.niche) count++;
    if (filters.location) count++;
    if (filters.channel !== "all") count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Leads Management
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              {filteredLeads.length} of {leads.length} Leads
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter high-intent prospects and launch direct multi-channel outreach campaigns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/lead-finder">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Compass className="w-4 h-4 text-indigo-600" />}
            >
              Discover Leads
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToCSV(filteredLeads)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddLead()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-bold"
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <LeadFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Leads Responsive Table */}
      <LeadTable leads={filteredLeads} />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
