"use client";

import React from "react";
import { MapBusiness } from "@/lib/types";
import { WebsiteStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Plus,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface BusinessCardProps {
  business: MapBusiness;
  isSelected: boolean;
  onSelect: () => void;
  onAddLead: () => void;
}

export function BusinessCard({
  business,
  isSelected,
  onSelect,
  onAddLead,
}: BusinessCardProps) {
  const isNoWebsite = business.websiteStatus === "No Website";

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
        isSelected
          ? "bg-indigo-50/70 border-indigo-400 shadow-md ring-2 ring-indigo-500/20"
          : isNoWebsite
          ? "bg-white border-rose-200/80 hover:border-rose-300 hover:shadow-xs"
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {business.name}
              </h4>
              <WebsiteStatusBadge status={business.websiteStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>{business.category}</span>
              <span>•</span>
              <span className="truncate">{business.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{business.rating}</span>
            <span className="text-slate-400 font-normal">({business.reviewCount})</span>
          </div>
        </div>

        {/* Opportunity Analysis Snippet */}
        <div
          className={`p-2.5 rounded-xl text-xs leading-relaxed ${
            isNoWebsite
              ? "bg-rose-50/70 text-rose-950 border border-rose-100"
              : "bg-slate-50 text-slate-700 border border-slate-100"
          }`}
        >
          {business.websiteAnalysis}
        </div>

        {/* Contact Snippets */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[160px]">{business.address}</span>
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{business.phone}</span>
          </span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
        <span className="text-xs text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
          <span>Inspect details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>

        <Button
          variant={business.alreadyAdded ? "secondary" : "primary"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddLead();
          }}
          disabled={business.alreadyAdded}
          leftIcon={
            business.alreadyAdded ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )
          }
          className="text-xs py-1.5"
        >
          {business.alreadyAdded ? "Added to CRM" : "+ Add Lead"}
        </Button>
      </div>
    </div>
  );
}
