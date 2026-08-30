"use client";

import React, { useState } from "react";
import { useToast } from "@/lib/context/toast-context";
import { useCRM } from "@/lib/context/crm-context";
import { SearchableSelect } from "@/components/lead-finder/SearchableSelect";
import {
  ManageOptionsModal,
} from "@/components/lead-finder/ManageOptionsModal";
import {
  RecentSearches,
  RecentSearchItem,
  RECENT_SEARCHES_KEY,
} from "@/components/lead-finder/RecentSearches";
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
  const { categories, countries, updateCategories, updateCountries } = useCRM();

  // Search Fields
  const [selectedCategory, setSelectedCategory] = useState<string>("Cleaning Services");
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [cityLocation, setCityLocation] = useState<string>("Wichita");

  // Recent Searches State with lazy initializer
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (savedSearches) {
          const parsed = JSON.parse(savedSearches);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to parse saved searches:", err);
      }
    }
    return [];
  });

  // Management Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Update Categories & Persist (Unified Single Source of Truth)
  const handleCategoriesChange = (newCategories: string[]) => {
    updateCategories(newCategories);
    // If currently selected category was removed, clear or select first available
    if (!newCategories.includes(selectedCategory)) {
      setSelectedCategory(newCategories[0] || "");
    }
  };

  // Update Countries & Persist
  const handleCountriesChange = (newCountries: string[]) => {
    updateCountries(newCountries);
    // If currently selected country was removed, clear or select first available
    if (!newCountries.includes(selectedCountry)) {
      setSelectedCountry(newCountries[0] || "");
    }
  };

  // Save Recent Search
  const saveRecentSearch = (category: string, country: string, city: string) => {
    const newItem: RecentSearchItem = {
      id: "search-" + Date.now(),
      category,
      country,
      city,
      timestamp: new Date().toISOString(),
    };

    const updated = [
      newItem,
      ...recentSearches.filter(
        (s) =>
          !(
            s.category.toLowerCase() === category.toLowerCase() &&
            s.country.toLowerCase() === country.toLowerCase() &&
            s.city.toLowerCase() === city.toLowerCase()
          )
      ),
    ].slice(0, 10);

    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save recent searches:", err);
    }
  };

  // Clear Recent Searches
  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (err) {
      console.error("Failed to clear recent searches:", err);
    }
    showToast({
      type: "info",
      title: "History Cleared",
      message: "Recent search history has been cleared.",
    });
  };

  // Remove Single Recent Search
  const handleRemoveRecentSearchItem = (id: string) => {
    const updated = recentSearches.filter((item) => item.id !== id);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to update recent searches:", err);
    }
  };

  // Main Google Maps Search Action
  const handleSearchGoogleMaps = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validate Category
    if (!selectedCategory.trim()) {
      showToast({
        type: "warning",
        title: "Category Required",
        message: "Please select a business category.",
      });
      return;
    }

    // 2. Validate Country
    if (!selectedCountry.trim()) {
      showToast({
        type: "warning",
        title: "Country Required",
        message: "Please select a country.",
      });
      return;
    }

    // 3. Validate City
    if (!cityLocation.trim()) {
      showToast({
        type: "warning",
        title: "City Required",
        message: "Please enter a city or location.",
      });
      return;
    }

    // Construct Search Query: Category, City, Country
    const query = `${selectedCategory.trim()}, ${cityLocation.trim()}, ${selectedCountry.trim()}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

    // Open Google Maps in new browser tab
    window.open(mapsUrl, "_blank", "noopener,noreferrer");

    // Save to Recent Searches
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

  return (
    <div className="space-y-6">
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

      {/* Recent Searches Section */}
      <RecentSearches
        searches={recentSearches}
        onSearchAgain={handleSearchAgain}
        onClearHistory={handleClearRecentSearches}
        onRemoveItem={handleRemoveRecentSearchItem}
      />

      {/* Pro Tips / Workflow Guide Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Quick Client Hunting Tips
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                1
              </span>
              <span>Target Local Niches</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Select high-ticket local services like Cleaning, Roofing, Dental, or Law firms to find businesses actively spending on marketing.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                2
              </span>
              <span>Find Website Gaps</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              On Google Maps, filter for businesses missing official websites or running outdated designs to pitch redesigns and SEO services.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200/60 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[11px] flex items-center justify-center">
                3
              </span>
              <span>Manage Options Easily</span>
            </p>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Use &quot;Manage Categories &amp; Countries&quot; to quickly add custom niches, target regions, or remove categories you don&apos;t service.
            </p>
          </div>
        </div>
      </div>

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
