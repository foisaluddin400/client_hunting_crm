"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/lib/context/toast-context";
import { useCRM } from "@/lib/context/crm-context";
import { SearchableSelect } from "@/components/lead-finder/SearchableSelect";
import { ManageOptionsModal } from "@/components/lead-finder/ManageOptionsModal";
import { RecentSearches, RecentSearchItem } from "@/components/lead-finder/RecentSearches";
import { LeadFinderTable } from "@/components/lead-finder/LeadFinderTable";
import { EditFinderBusinessModal } from "@/components/lead-finder/EditFinderBusinessModal";
import { LeadFinderBusinessItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  MapPin,
  SlidersHorizontal,
  Compass,
  Sparkles,
  ExternalLink,
  Briefcase,
  Globe,
  Lightbulb,
} from "lucide-react";

export default function LeadFinderPage() {
  const { showToast } = useToast();
  const { categories, countries, updateCategories, updateCountries, refreshData, refreshStats } =
    useCRM();

  // Search Fields
  const [selectedCategory, setSelectedCategory] = useState<string>("Cleaning Services");
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [cityLocation, setCityLocation] = useState<string>("Wichita");

  // Database-backed Recent Searches State
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Lead Finder Businesses State
  const [finderBusinesses, setFinderBusinesses] = useState<LeadFinderBusinessItem[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState<boolean>(true);

  // Edit Modal State
  const [editingBusiness, setEditingBusiness] = useState<LeadFinderBusinessItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Management Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // 1. Fetch Recent Searches from MongoDB
  const fetchRecentSearches = useCallback(async () => {
    try {
      const res = await fetch("/api/google-maps-searches");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.searches)) {
          setRecentSearches(data.searches);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Google Maps searches:", err);
    }
  }, []);

  // 2. Fetch Lead Finder Businesses from MongoDB
  const fetchFinderBusinesses = useCallback(async () => {
    setIsLoadingBusinesses(true);
    try {
      const res = await fetch("/api/lead-finder");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.businesses)) {
          setFinderBusinesses(data.businesses);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Lead Finder businesses:", err);
    } finally {
      setIsLoadingBusinesses(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSearches();
    fetchFinderBusinesses();
  }, [fetchRecentSearches, fetchFinderBusinesses]);

  // Update Categories & Persist
  const handleCategoriesChange = (newCategories: string[]) => {
    updateCategories(newCategories);
    if (!newCategories.includes(selectedCategory)) {
      setSelectedCategory(newCategories[0] || "");
    }
  };

  // Update Countries & Persist
  const handleCountriesChange = (newCountries: string[]) => {
    updateCountries(newCountries);
    if (!newCountries.includes(selectedCountry)) {
      setSelectedCountry(newCountries[0] || "");
    }
  };

  // Save Recent Search to MongoDB
  const saveRecentSearch = async (category: string, country: string, city: string) => {
    try {
      const res = await fetch("/api/google-maps-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, country, city }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.search) {
          setRecentSearches((prev) => [
            data.search,
            ...prev.filter(
              (s) =>
                s.id !== data.search.id &&
                !(
                  s.category.toLowerCase() === data.search.category.toLowerCase() &&
                  s.country.toLowerCase() === data.search.country.toLowerCase() &&
                  s.city.toLowerCase() === data.search.city.toLowerCase()
                )
            ),
          ].slice(0, 10));
        }
      }
    } catch (err) {
      console.error("Failed to save search to database:", err);
    }
  };

  // Clear Recent Searches in MongoDB
  const handleClearRecentSearches = async () => {
    try {
      const res = await fetch("/api/google-maps-searches", { method: "DELETE" });
      if (res.ok) {
        setRecentSearches([]);
        showToast({
          type: "info",
          title: "History Cleared",
          message: "Recent search history removed from database.",
        });
      }
    } catch (err) {
      console.error("Failed to clear searches:", err);
    }
  };

  // Remove Single Recent Search in MongoDB
  const handleRemoveRecentSearchItem = async (id: string) => {
    try {
      setRecentSearches((prev) => prev.filter((s) => s.id !== id));
      await fetch(`/api/google-maps-searches/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete search item:", err);
    }
  };

  // Main Google Maps Search Action
  const handleSearchGoogleMaps = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCategory.trim()) {
      showToast({
        type: "warning",
        title: "Category Required",
        message: "Please select a business category.",
      });
      return;
    }

    if (!selectedCountry.trim()) {
      showToast({
        type: "warning",
        title: "Country Required",
        message: "Please select a country.",
      });
      return;
    }

    if (!cityLocation.trim()) {
      showToast({
        type: "warning",
        title: "City Required",
        message: "Please enter a city or location.",
      });
      return;
    }

    const query = `${selectedCategory.trim()}, ${cityLocation.trim()}, ${selectedCountry.trim()}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
    saveRecentSearch(selectedCategory.trim(), selectedCountry.trim(), cityLocation.trim());

    showToast({
      type: "info",
      title: "Opening Google Maps",
      message: `Searching for "${query}" in a new tab...`,
      duration: 3500,
    });
  };

  // Re-run Search from Recent Search Item
  const handleSearchAgain = (item: RecentSearchItem) => {
    setSelectedCategory(item.category);
    setSelectedCountry(item.country);
    setCityLocation(item.city);

    const query = `${item.category}, ${item.city}, ${item.country}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");

    saveRecentSearch(item.category, item.country, item.city);

    showToast({
      type: "info",
      title: "Opening Google Maps",
      message: `Re-running search for "${query}"...`,
    });
  };

  // Toggle Checkbox for moving to / removing from Leads
  const handleToggleSelectBusiness = async (business: LeadFinderBusinessItem) => {
    const nextSelected = !business.isSelected;

    try {
      const res = await fetch(`/api/lead-finder/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: nextSelected }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: "warning",
          title: "Action Restricted",
          message: data.error || "Cannot modify lead status.",
        });
        return;
      }

      if (data.business) {
        setFinderBusinesses((prev) =>
          prev.map((b) => (b.id === business.id ? data.business : b))
        );
      }

      // Refresh Leads list in CRM context
      await refreshData();
      await refreshStats();

      showToast({
        type: "success",
        title: nextSelected ? "Moved to Leads" : "Removed from Leads",
        message: nextSelected
          ? `"${business.businessName}" is now available in your Leads route.`
          : `"${business.businessName}" removed from Leads.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to update lead selection.",
      });
    }
  };

  // All Leads confirmation action
  const handleSelectAllEligible = async () => {
    try {
      const res = await fetch("/api/lead-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "selectAll" }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Confirmation Failed",
          message: data.error || "Failed to confirm all leads.",
        });
        return;
      }

      await fetchFinderBusinesses();
      await refreshData();
      await refreshStats();

      showToast({
        type: "success",
        title: "All Leads Confirmed!",
        message: data.message || "All eligible businesses have been added to Leads.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Action Failed",
        message: err.message,
      });
    }
  };

  // Open Edit Business Modal
  const handleOpenEditModal = (business: LeadFinderBusinessItem) => {
    setEditingBusiness(business);
    setIsEditModalOpen(true);
  };

  // Save updates from Edit Modal
  const handleSaveBusinessUpdates = async (
    id: string,
    updates: Partial<LeadFinderBusinessItem>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lead-finder/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Update Failed",
          message: data.error || "Failed to update business.",
        });
        return false;
      }

      if (data.business) {
        setFinderBusinesses((prev) =>
          prev.map((b) => (b.id === id ? data.business : b))
        );
      }

      await refreshData();

      showToast({
        type: "success",
        title: "Business Updated",
        message: "Changes saved to database.",
      });
      return true;
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      });
      return false;
    }
  };

  // Delete Business from Finder
  const handleDeleteBusiness = async (business: LeadFinderBusinessItem) => {
    const isProtected = business.isConnected;
    const confirmPrompt = isProtected
      ? `Delete "${business.businessName}" from Lead Finder?\n\nNote: Because this is a Protected Connected Lead, it will remain 100% safe in your Leads data.`
      : `Delete "${business.businessName}" from Lead Finder?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      const res = await fetch(`/api/lead-finder/${business.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: data.error || "Failed to delete business.",
        });
        return;
      }

      setFinderBusinesses((prev) => prev.filter((b) => b.id !== business.id));
      await refreshStats();

      showToast({
        type: "warning",
        title: "Finder Record Deleted",
        message: data.message || `"${business.businessName}" removed from Lead Finder.`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Search Card: Find Businesses on Google Maps */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
        {/* Header with Title and Manage Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Find Businesses
                </h2>
                <p className="text-xs text-slate-500">
                  Search Google Maps for potential clients
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsManageModalOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />}
            className="text-xs font-semibold self-start sm:self-auto shrink-0 shadow-2xs"
          >
            Manage Categories & Countries
          </Button>
        </div>

        {/* Search Inputs Form */}
        <form onSubmit={handleSearchGoogleMaps} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            {/* 1. Business Category Selector */}
            <div className="sm:col-span-4">
              <SearchableSelect
                label="Business Type"
                placeholder="Select Business Category"
                searchPlaceholder="Search categories..."
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={categories}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            </div>

            {/* 2. Country Selector */}
            <div className="sm:col-span-3">
              <SearchableSelect
                label="Country"
                placeholder="Select Country"
                searchPlaceholder="Search countries..."
                value={selectedCountry}
                onChange={(val) => setSelectedCountry(val)}
                options={countries}
                leftIcon={<Globe className="w-4 h-4" />}
              />
            </div>

            {/* 3. City / Location Input */}
            <div className="sm:col-span-3 flex flex-col space-y-1.5">
              <label
                htmlFor="city-input"
                className="text-xs font-semibold text-slate-700 tracking-wide"
              >
                City / Location
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="city-input"
                  type="text"
                  value={cityLocation}
                  onChange={(e) => setCityLocation(e.target.value)}
                  placeholder="Enter city (e.g. Wichita)..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* 4. Search Google Maps Action Button */}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                rightIcon={<ExternalLink className="w-4 h-4" />}
                className="w-full py-2.5 font-bold shadow-md h-[42px]"
              >
                Search Google Maps
              </Button>
            </div>
          </div>
        </form>

        {/* Current Query Preview Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Search:</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 truncate">
            {selectedCategory || "Category"} • {cityLocation || "City"}, {selectedCountry || "Country"}
          </span>
        </div>
      </div>

      {/* Saved Google Maps Businesses Table */}
      <section className="space-y-4">
        <LeadFinderTable
          businesses={finderBusinesses}
          isLoading={isLoadingBusinesses}
          categories={categories}
          onToggleSelect={handleToggleSelectBusiness}
          onSelectAllEligible={handleSelectAllEligible}
          onEditBusiness={handleOpenEditModal}
          onDeleteBusiness={handleDeleteBusiness}
        />
      </section>

      {/* Recent Searches Section (MongoDB-Backed) */}
      <RecentSearches
        searches={recentSearches}
        onSearchAgain={handleSearchAgain}
        onClearHistory={handleClearRecentSearches}
        onRemoveItem={handleRemoveRecentSearchItem}
      />

      {/* Quick Client Hunting Tips Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Client Hunting &amp; Lead Finder Workflow
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                1
              </span>
              <span>Scrape &amp; Save from Extension</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Open Google Maps with your extension, select candidate businesses, and click &quot;Save Data&quot; to import them directly here.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                2
              </span>
              <span>Review &amp; Select for Leads</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Review business ratings, reviews, and hours in this table. Check businesses individually or click &quot;All Leads&quot; to move them to the Leads route.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                3
              </span>
              <span>Connected Lead Protection</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Once you start outreach from the Leads route, the lead becomes Connected. Connected leads are protected from accidental removal or unchecking.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Finder Business Modal */}
      <EditFinderBusinessModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBusiness(null);
        }}
        business={editingBusiness}
        onSave={handleSaveBusinessUpdates}
        categories={categories}
      />

      {/* Categories & Countries Management Modal */}
      <ManageOptionsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        categories={categories}
        onCategoriesChange={handleCategoriesChange}
        countries={countries}
        onCountriesChange={handleCountriesChange}
      />
    </div>
  );
}
