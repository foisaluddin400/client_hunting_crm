"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
  id?: string;
}

export function SearchableSelect({
  label,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  value,
  onChange,
  options,
  leftIcon,
  disabled = false,
  className,
  error,
  helperText,
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listboxId = `${id || generatedId}-listbox`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);

  return (
    <div className={cn("w-full flex flex-col space-y-1.5 relative", className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
          {value && (
            <span className="text-[10px] text-indigo-600 font-medium font-mono">
              Selected
            </span>
          )}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-2xs transition-all cursor-pointer select-none text-left",
          "hover:border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
          isOpen && "border-indigo-500 ring-2 ring-indigo-500/20",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400 opacity-60",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
          {leftIcon && (
            <span className="text-slate-400 shrink-0 flex items-center">
              {leftIcon}
            </span>
          )}
          {value ? (
            <span className="font-semibold text-slate-900 truncate">{value}</span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180 text-indigo-600"
            )}
          />
        </div>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search Box in Dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between group",
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                    )}
                  >
                    <span className="truncate mr-2">{opt}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-600">No matching options</p>
                <p className="text-[11px] mt-0.5">Try searching with a different keyword</p>
              </div>
            )}
          </div>

          {/* Footer showing count */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{filteredOptions.length} available</span>
            {searchTerm && <span>Filtered by &quot;{searchTerm}&quot;</span>}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
