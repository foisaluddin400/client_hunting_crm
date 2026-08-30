"use client";

import React from "react";
import { useCRM } from "@/lib/context/crm-context";
import {
  UtensilsCrossed,
  Home,
  Hammer,
  Sparkles,
  Dumbbell,
  Calculator,
  Briefcase,
  Building,
  Scale,
  Bed,
  Wrench,
  Camera,
  ShoppingBag,
  Truck,
  Trees,
  Scissors,
  Stethoscope,
  Paintbrush,
  Zap,
  Tag,
} from "lucide-react";

// Curated styling for common business niches
const KNOWN_NICHE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; barColor: string }
> = {
  "Real Estate": {
    icon: <Home className="w-4 h-4 text-emerald-600" />,
    color: "text-emerald-700 bg-emerald-50",
    barColor: "bg-emerald-500",
  },
  "Real Estate Agencies": {
    icon: <Home className="w-4 h-4 text-emerald-600" />,
    color: "text-emerald-700 bg-emerald-50",
    barColor: "bg-emerald-500",
  },
  Restaurants: {
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-600" />,
    color: "text-amber-700 bg-amber-50",
    barColor: "bg-amber-500",
  },
  "Cleaning Services": {
    icon: <Sparkles className="w-4 h-4 text-teal-600" />,
    color: "text-teal-700 bg-teal-50",
    barColor: "bg-teal-500",
  },
  Construction: {
    icon: <Hammer className="w-4 h-4 text-blue-600" />,
    color: "text-blue-700 bg-blue-50",
    barColor: "bg-blue-500",
  },
  "Construction Companies": {
    icon: <Hammer className="w-4 h-4 text-blue-600" />,
    color: "text-blue-700 bg-blue-50",
    barColor: "bg-blue-500",
  },
  Accounting: {
    icon: <Calculator className="w-4 h-4 text-indigo-600" />,
    color: "text-indigo-700 bg-indigo-50",
    barColor: "bg-indigo-500",
  },
  "Accounting Firms": {
    icon: <Calculator className="w-4 h-4 text-indigo-600" />,
    color: "text-indigo-700 bg-indigo-50",
    barColor: "bg-indigo-500",
  },
  Salons: {
    icon: <Scissors className="w-4 h-4 text-purple-600" />,
    color: "text-purple-700 bg-purple-50",
    barColor: "bg-purple-500",
  },
  "Dental Clinics": {
    icon: <Stethoscope className="w-4 h-4 text-cyan-600" />,
    color: "text-cyan-700 bg-cyan-50",
    barColor: "bg-cyan-500",
  },
  "Law Firms": {
    icon: <Scale className="w-4 h-4 text-slate-700" />,
    color: "text-slate-800 bg-slate-100",
    barColor: "bg-slate-700",
  },
  Hotels: {
    icon: <Bed className="w-4 h-4 text-sky-600" />,
    color: "text-sky-700 bg-sky-50",
    barColor: "bg-sky-500",
  },
  Gyms: {
    icon: <Dumbbell className="w-4 h-4 text-rose-600" />,
    color: "text-rose-700 bg-rose-50",
    barColor: "bg-rose-500",
  },
  "Auto Repair Shops": {
    icon: <Wrench className="w-4 h-4 text-orange-600" />,
    color: "text-orange-700 bg-orange-50",
    barColor: "bg-orange-500",
  },
  "Plumbing Services": {
    icon: <Wrench className="w-4 h-4 text-blue-600" />,
    color: "text-blue-700 bg-blue-50",
    barColor: "bg-blue-500",
  },
  "Roofing Companies": {
    icon: <Building className="w-4 h-4 text-amber-700" />,
    color: "text-amber-800 bg-amber-50",
    barColor: "bg-amber-600",
  },
  "Landscaping Services": {
    icon: <Trees className="w-4 h-4 text-emerald-600" />,
    color: "text-emerald-700 bg-emerald-50",
    barColor: "bg-emerald-500",
  },
  "Marketing Agencies": {
    icon: <Zap className="w-4 h-4 text-violet-600" />,
    color: "text-violet-700 bg-violet-50",
    barColor: "bg-violet-500",
  },
  "Photography Studios": {
    icon: <Camera className="w-4 h-4 text-pink-600" />,
    color: "text-pink-700 bg-pink-50",
    barColor: "bg-pink-500",
  },
  "Beauty Clinics": {
    icon: <Sparkles className="w-4 h-4 text-fuchsia-600" />,
    color: "text-fuchsia-700 bg-fuchsia-50",
    barColor: "bg-fuchsia-500",
  },
  "Furniture Stores": {
    icon: <Paintbrush className="w-4 h-4 text-yellow-700" />,
    color: "text-yellow-800 bg-yellow-50",
    barColor: "bg-yellow-600",
  },
  "Retail Stores": {
    icon: <ShoppingBag className="w-4 h-4 text-indigo-600" />,
    color: "text-indigo-700 bg-indigo-50",
    barColor: "bg-indigo-500",
  },
  "Moving Companies": {
    icon: <Truck className="w-4 h-4 text-stone-600" />,
    color: "text-stone-700 bg-stone-100",
    barColor: "bg-stone-600",
  },
  Others: {
    icon: <Tag className="w-4 h-4 text-slate-600" />,
    color: "text-slate-700 bg-slate-100",
    barColor: "bg-slate-500",
  },
  Other: {
    icon: <Tag className="w-4 h-4 text-slate-600" />,
    color: "text-slate-700 bg-slate-100",
    barColor: "bg-slate-500",
  },
};

// Fallback color palettes for custom user-created categories
const DYNAMIC_PALETTES = [
  { color: "text-indigo-700 bg-indigo-50", barColor: "bg-indigo-500", icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
  { color: "text-emerald-700 bg-emerald-50", barColor: "bg-emerald-500", icon: <Sparkles className="w-4 h-4 text-emerald-600" /> },
  { color: "text-cyan-700 bg-cyan-50", barColor: "bg-cyan-500", icon: <Building className="w-4 h-4 text-cyan-600" /> },
  { color: "text-amber-700 bg-amber-50", barColor: "bg-amber-500", icon: <Zap className="w-4 h-4 text-amber-600" /> },
  { color: "text-rose-700 bg-rose-50", barColor: "bg-rose-500", icon: <Briefcase className="w-4 h-4 text-rose-600" /> },
  { color: "text-purple-700 bg-purple-50", barColor: "bg-purple-500", icon: <Sparkles className="w-4 h-4 text-purple-600" /> },
  { color: "text-teal-700 bg-teal-50", barColor: "bg-teal-500", icon: <Building className="w-4 h-4 text-teal-600" /> },
];

function getNicheConfig(name: string) {
  if (KNOWN_NICHE_CONFIG[name]) {
    return KNOWN_NICHE_CONFIG[name];
  }
  // Case-insensitive lookup in known configs
  const lower = name.toLowerCase();
  const matchedKey = Object.keys(KNOWN_NICHE_CONFIG).find(
    (k) => k.toLowerCase() === lower
  );
  if (matchedKey) {
    return KNOWN_NICHE_CONFIG[matchedKey];
  }
  // Deterministic palette selection based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTES.length;
  return DYNAMIC_PALETTES[index];
}

export function TopNiches() {
  const { leads, categories } = useCRM();

  // Clean dynamic categories from single source of truth
  const dynamicCategories = categories.filter(
    (c) => c.toLowerCase() !== "others" && c.toLowerCase() !== "other"
  );

  // Initialize counts for all dynamic categories + Others
  const counts: Record<string, number> = {};
  for (const cat of dynamicCategories) {
    counts[cat] = 0;
  }
  counts["Others"] = 0;

  // Tally leads across dynamic categories and Others
  leads.forEach((l) => {
    const leadNiche = (l.niche || "").trim();
    if (!leadNiche || leadNiche.toLowerCase() === "others" || leadNiche.toLowerCase() === "other") {
      counts["Others"] = (counts["Others"] || 0) + 1;
      return;
    }

    // Match exact or case-insensitive category
    const matchedCategory = dynamicCategories.find(
      (c) => c.toLowerCase() === leadNiche.toLowerCase()
    );

    if (matchedCategory) {
      counts[matchedCategory] = (counts[matchedCategory] || 0) + 1;
    } else {
      // Unmatched custom niche counts under Others
      counts["Others"] = (counts["Others"] || 0) + 1;
    }
  });

  const total = leads.length || 1;

  // Build sorted list of niches
  const allNiches = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100),
    config: getNicheConfig(name),
  }));

  // Sort by lead count descending, preserving category order for equal counts
  allNiches.sort((a, b) => b.count - a.count);

  // Determine which categories to show on dashboard:
  // 1. Show all categories with count > 0
  // 2. Ensure at least 6 categories (or all available if fewer) plus "Others" are displayed
  const activeNiches = allNiches.filter((n) => n.count > 0);
  const zeroNiches = allNiches.filter((n) => n.count === 0 && n.name !== "Others");
  const othersNiche = allNiches.find((n) => n.name === "Others");

  let displayedNiches = [...activeNiches];
  if (displayedNiches.length < 6) {
    const remainingSlots = 6 - displayedNiches.length;
    displayedNiches = [
      ...displayedNiches,
      ...zeroNiches.slice(0, remainingSlots),
    ];
  }

  // Ensure Others is included if it's not already in the list
  if (othersNiche && !displayedNiches.some((n) => n.name === "Others")) {
    displayedNiches.push(othersNiche);
  }

  // Final sort of the displayed items
  displayedNiches.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.name === "Others") return 1;
    if (b.name === "Others") return -1;
    return 0;
  });

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Top Business Niches
          </h3>
          <p className="text-xs text-slate-500">
            Prospect distribution across target agency industries
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
          {dynamicCategories.length} Categories
        </span>
      </div>

      <div className="space-y-3.5 pt-1">
        {displayedNiches.map(({ name, count, percentage, config }) => (
          <div key={name} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.color} shrink-0`}>
                  {config.icon}
                </div>
                <span className="font-bold text-slate-800">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{count} leads</span>
                <span className="text-[11px] text-slate-400 font-medium w-8 text-right">
                  {percentage}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                style={{ width: `${Math.max(percentage, 5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
