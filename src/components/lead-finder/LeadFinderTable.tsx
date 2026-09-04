"use client";

import React, { useState, useMemo } from "react";
import { LeadFinderBusinessItem } from "@/lib/types";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  CheckSquare,
  Square,
  Lock,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  Compass,
  Sparkles,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface LeadFinderTableProps {
  businesses: LeadFinderBusinessItem[];
  isLoading: boolean;
  categories: string[];
  onToggleSelect: (business: LeadFinderBusinessItem) => void;
  onSelectAllEligible: () => void;
  onEditBusiness: (business: LeadFinderBusinessItem) => void;
  onDeleteBusiness: (business: LeadFinderBusinessItem) => void;
}

export function LeadFinderTable({
  businesses,
  isLoading,
  categories,
  onToggleSelect,
  onSelectAllEligible,
  onEditBusiness,
  onDeleteBusiness,
}: LeadFinderTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // 1. Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = b.businessName.toLowerCase().includes(q);
        const matchPhone = b.phone?.toLowerCase().includes(q);
        const matchEmail = b.email?.toLowerCase().includes(q);
        const matchAddr = b.fullAddress?.toLowerCase().includes(q);
        const matchCat = b.businessCategory?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchAddr && !matchCat) {
          return false;
        }
      }

      // 2. Category
      if (categoryFilter !== "all" && b.businessCategory !== categoryFilter) {
        return false;
      }

      // 3. Status
      if (statusFilter === "connected" && !b.isConnected) return false;
      if (statusFilter === "inLeads" && !b.isSelected) return false;
      if (statusFilter === "finderOnly" && b.isSelected) return false;

      // 4. Date/Time Filter
      if (timeFilter !== "all") {
        const itemDate = new Date(b.foundAt);
        const now = new Date();

        if (timeFilter === "today") {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (itemDate < startOfToday) return false;
        } else if (timeFilter === "yesterday") {
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (itemDate < startOfYesterday || itemDate >= endOfYesterday) return false;
        } else if (timeFilter === "7days") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo) return false;
        } else if (timeFilter === "30days") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (timeFilter === "custom" && customStartDate) {
          const start = new Date(customStartDate);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999);
          if (itemDate < start || itemDate > end) return false;
        }
      }

      return true;
    });
  }, [
    businesses,
    search,
    categoryFilter,
    statusFilter,
    timeFilter,
    customStartDate,
    customEndDate,
  ]);

  // Total pages and pagination slice
  const totalPages = Math.ceil(filteredBusinesses.length / pageSize) || 1;
  const paginatedList = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedCount = businesses.filter((b) => b.isSelected).length;
  const eligibleUnselectedCount = businesses.filter((b) => !b.isSelected).length;

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Collected Google Maps Businesses
              </h3>
              <p className="text-xs text-slate-500">
                Saved from the Google Maps Chrome Extension • Select leads to move to the Leads route
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* All Leads action button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onSelectAllEligible}
            disabled={eligibleUnselectedCount === 0}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="font-bold shadow-2xs bg-indigo-600 hover:bg-indigo-700"
          >
            All Leads ({eligibleUnselectedCount} Available)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, phone, email, or city..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="inLeads">✓ In Leads ({selectedCount})</option>
              <option value="finderOnly">Finder Only ({businesses.length - selectedCount})</option>
              <option value="connected">🛡 Protected / Connected</option>
            </select>

            {/* Date/Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs (if timeFilter === 'custom') */}
        {timeFilter === "custom" && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">Move</th>
                <th className="p-4">Business</th>
                <th className="p-4">Rating & Reviews</th>
                <th className="p-4">Category</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Address</th>
                <th className="p-4">Hours / Status</th>
                <th className="p-4">Found Date & Time</th>
                <th className="p-4">Leads State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={10} />
                ))
              ) : paginatedList.length > 0 ? (
                paginatedList.map((business) => {
                  const isChecked = business.isSelected;
                  const isLocked = business.isConnected;

                  return (
                    <tr
                      key={business.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      {/* Checkbox (with connected lead protection) */}
                      <td className="p-4 text-center">
                        {isLocked ? (
                          <Tooltip content="Connected Lead (Protected): Cannot be removed from Leads because outreach/connection was established.">
                            <span className="inline-flex items-center justify-center p-1 rounded-md text-amber-600 bg-amber-50 border border-amber-200 cursor-not-allowed">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          </Tooltip>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleSelect(business)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title={
                              isChecked
                                ? "Uncheck to remove from Leads"
                                : "Check to move to Leads"
                            }
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>

                      {/* Business Name & Google Maps Place link */}
                      <td className="p-4">
                        <div className="space-y-0.5 min-w-0 max-w-[180px]">
                          <span className="font-bold text-slate-900 block truncate text-sm">
                            {business.businessName}
                          </span>
                          {business.googleMapsUrl && (
                            <a
                              href={business.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <span>View on Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Rating & Reviews */}
                      <td className="p-4">
                        {business.rating ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              {business.rating.toFixed(1)}
                            </span>
                            {business.totalReviews !== null &&
                              business.totalReviews !== undefined && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({business.totalReviews})
                                </span>
                              )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-700">
                        {business.businessCategory ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium truncate max-w-[140px]">
                            {business.businessCategory}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Contact Info (Phone / Email / Website) */}
                      <td className="p-4">
                        <div className="space-y-1 text-xs">
                          {business.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{business.phone}</span>
                            </div>
                          ) : null}

                          {business.email ? (
                            <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{business.email}</span>
                            </div>
                          ) : null}

                          {business.website ? (
                            <div className="flex items-center gap-1.5 text-indigo-600 text-[11px]">
                              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                              <a
                                href={
                                  business.website.startsWith("http")
                                    ? business.website
                                    : `https://${business.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate max-w-[130px] hover:underline"
                              >
                                {business.website.replace(/^https?:\/\/(www\.)?/, "")}
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">No website</span>
                          )}
                        </div>
                      </td>

                      {/* Full Address */}
                      <td className="p-4 text-slate-600">
                        <div className="flex items-start gap-1 max-w-[170px] text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed text-[11px]">
                            {business.fullAddress || "Address not provided"}
                          </span>
                        </div>
                      </td>

                      {/* Opening Hours / Open-Closed Status */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {business.openClosed ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                /closed/i.test(business.openClosed)
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {business.openClosed}
                            </span>
                          ) : null}
                          {business.openingHours && (
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                              {business.openingHours}
                            </p>
                          )}
                          {!business.openClosed && !business.openingHours && (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time Found / Imported */}
                      <td className="p-4 text-slate-600 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(business.foundAt)}</span>
                        </div>
                      </td>

                      {/* Leads State Tag */}
                      <td className="p-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3" />
                            Connected
                          </span>
                        ) : isChecked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            In Leads
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Finder Only
                          </span>
                        )}
                      </td>

                      {/* Action Buttons: Edit and Delete */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip content="Edit Business Details">
                            <button
                              type="button"
                              onClick={() => onEditBusiness(business)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Delete Finder Record (Connected Leads remain protected)">
                            <button
                              type="button"
                              onClick={() => onDeleteBusiness(business)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-0">
                    <EmptyState
                      icon={<Compass className="w-6 h-6 text-indigo-600" />}
                      title="No businesses found in Lead Finder"
                      description="Scrape businesses from Google Maps using the extension and click 'Save Data' to view them here."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBusinesses.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
