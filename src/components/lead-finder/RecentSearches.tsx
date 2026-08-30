"use client";

import React from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  History,
  ExternalLink,
  Trash2,
  MapPin,
} from "lucide-react";

export interface RecentSearchItem {
  id: string;
  category: string;
  country: string;
  city: string;
  timestamp: string;
}

export const RECENT_SEARCHES_KEY = "leadflow_leadfinder_recent_searches";

interface RecentSearchesProps {
  searches: RecentSearchItem[];
  onSearchAgain: (item: RecentSearchItem) => void;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export function RecentSearches({
  searches,
  onSearchAgain,
  onClearHistory,
  onRemoveItem,
}: RecentSearchesProps) {
  if (!searches || searches.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Recent Google Maps Searches</span>
        </div>
        <p className="text-xs text-slate-400">
          No searches conducted yet. Select a category, country, and city above to launch a targeted Google Maps client hunt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Recent Google Maps Searches
            </h3>
            <p className="text-[11px] text-slate-500">
              Instant one-click shortcuts to re-run your previous client hunting queries
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
          title="Clear search history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear History</span>
        </button>
      </div>

      {/* Grid of recent searches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {searches.map((item) => {
          return (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-2xs transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-600 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {item.city}, {item.country}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Remove from history"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSearchAgain(item)}
                  rightIcon={<ExternalLink className="w-3 h-3 text-indigo-600" />}
                  className="text-xs py-1 px-2.5 font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200/80 hover:border-indigo-300"
                >
                  Search Again
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
