"use client";

import React, { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  History,
  ExternalLink,
  Trash2,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export interface RecentSearchItem {
  id: string;
  category: string;
  country: string;
  city: string;
  query?: string;
  businessCount?: number;
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
  const [searchToDelete, setSearchToDelete] = useState<RecentSearchItem | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

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

  const handleConfirmDelete = () => {
    if (searchToDelete) {
      onRemoveItem(searchToDelete.id);
      setSearchToDelete(null);
    }
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setIsConfirmingClear(false);
  };

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
          onClick={() => setIsConfirmingClear(true)}
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
          const displayQuery =
            item.query || `${item.category}, ${item.city}, ${item.country}`;

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-2xs transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors"
                    title={displayQuery}
                  >
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <div className="flex items-center gap-1 truncate min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {item.city}, {item.country}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-indigo-600 shrink-0 ml-2">
                    {item.businessCount ?? 0} businesses
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSearchToDelete(item)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md hover:bg-rose-50"
                  title="Remove from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Single Search Confirmation Modal */}
      <Modal
        isOpen={Boolean(searchToDelete)}
        onClose={() => setSearchToDelete(null)}
        maxWidth="sm"
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Delete Recent Search?</span>
          </div>
        }
      >
        {searchToDelete && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">
                &quot;{searchToDelete.category}, {searchToDelete.city}, {searchToDelete.country}&quot;
              </strong>{" "}
              from your Recent Google Maps Searches history?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSearchToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Yes, Delete Search
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear All History Confirmation Modal */}
      <Modal
        isOpen={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        maxWidth="sm"
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Clear Search History?</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to clear your entire Google Maps search history? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmClear}>
              Yes, Clear All History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
