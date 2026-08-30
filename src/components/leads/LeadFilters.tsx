"use client";

import React, { useState } from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  WebsiteStatus,
  LeadStatus,
  Channel,
  LeadFiltersState,
} from "@/lib/types";
import { SearchInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onFilterChange: (filters: Partial<LeadFiltersState>) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

export function LeadFilters({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: LeadFiltersProps) {
  const { categories } = useCRM();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const dynamicCategories = categories.filter(
    (c) => c.toLowerCase() !== "others" && c.toLowerCase() !== "other"
  );

  return (
    <div className="space-y-3">
      {/* Primary Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchInput
            value={filters.search}
            onChange={(val) => onFilterChange({ search: val })}
            onClear={() => onFilterChange({ search: "" })}
            placeholder="Search business, CEO name, email, or city..."
          />
        </div>

        {/* Quick Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Website Status Filter */}
          <select
            value={filters.websiteStatus}
            onChange={(e) =>
              onFilterChange({
                websiteStatus: e.target.value as WebsiteStatus | "all",
              })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Website: All</option>
            <option value="No Website">🔥 No Website</option>
            <option value="Redesign">⚠️ Redesign Needed</option>
            <option value="SEO Performance">📉 SEO Issues</option>
            <option value="Other">✓ Other / Good</option>
          </select>

          {/* Lead Status Filter */}
          <select
            value={filters.leadStatus}
            onChange={(e) =>
              onFilterChange({
                leadStatus: e.target.value as LeadStatus | "all",
              })
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Interested">Interested 🔥</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Meeting">Meeting 📅</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won 🎉</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Toggle Advanced Filters */}
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold ml-1">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<RotateCcw className="w-3 h-3 text-slate-400" />}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Industry / Niche
            </label>
            <select
              value={filters.niche}
              onChange={(e) => onFilterChange({ niche: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Niches</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Location / City
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => onFilterChange({ location: e.target.value })}
              placeholder="e.g. Austin, Wichita, Miami..."
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Available Contact Channel
            </label>
            <select
              value={filters.channel}
              onChange={(e) =>
                onFilterChange({ channel: e.target.value as Channel | "all" })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Channel Available</option>
              <option value="email">Has Email Address</option>
              <option value="whatsapp">Has WhatsApp Number</option>
              <option value="linkedin">Has LinkedIn Profile</option>
              <option value="instagram">Has Instagram Handle</option>
              <option value="facebook">Has Facebook Page</option>
              <option value="twitter">Has Twitter/X Profile</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1">
            Active filters:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium">
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.websiteStatus !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium">
              Website: {filters.websiteStatus}
              <button
                onClick={() => onFilterChange({ websiteStatus: "all" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.leadStatus !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium">
              Status: {filters.leadStatus}
              <button
                onClick={() => onFilterChange({ leadStatus: "all" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.niche && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium">
              Niche: {filters.niche}
              <button
                onClick={() => onFilterChange({ niche: "" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium">
              Location: {filters.location}
              <button
                onClick={() => onFilterChange({ location: "" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.channel !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium capitalize">
              Channel: {filters.channel}
              <button
                onClick={() => onFilterChange({ channel: "all" })}
                className="hover:text-indigo-950"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
