"use client";

import React, { useState } from "react";
import { MapBusiness } from "@/lib/types";
import {
  MapPin,
  Star,
  Plus,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation2,
  Building2,
  UtensilsCrossed,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
} from "lucide-react";
import { WebsiteStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface MockMapViewProps {
  businesses: MapBusiness[];
  selectedBusiness: MapBusiness | null;
  onSelectBusiness: (business: MapBusiness) => void;
  onAddLead: (business: MapBusiness) => void;
}

export function MockMapView({
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onAddLead,
}: MockMapViewProps) {
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain">("standard");
  const [zoomLevel, setZoomLevel] = useState(14);

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-[#e5e3df] select-none">
      {/* Mock Map Canvas / Vector Roads and Landmarks */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          mapType === "satellite"
            ? "bg-[#1f2937] text-slate-200"
            : mapType === "terrain"
            ? "bg-[#e8ece0]"
            : "bg-[#eef1f5]"
        }`}
      >
        {/* SVG Grid & Realistic Map Geometry */}
        <svg className="w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
          {/* Water body / River */}
          <path
            d="M -50,300 C 150,260 300,380 550,310 C 750,250 950,390 1200,320"
            fill="none"
            stroke="#a5bfd6"
            strokeWidth="38"
            strokeLinecap="round"
          />
          {/* Park area */}
          <path
            d="M 120,80 Q 240,60 280,160 T 160,220 Z"
            fill="#d2f1d2"
            stroke="#b6e8b6"
            strokeWidth="2"
          />
          <path
            d="M 680,380 Q 820,340 860,460 T 720,500 Z"
            fill="#d2f1d2"
            stroke="#b6e8b6"
            strokeWidth="2"
          />

          {/* Primary Avenues / Highways (Yellow/Orange) */}
          <line x1="-50" y1="180" x2="1300" y2="200" stroke="#fcd34d" strokeWidth="10" />
          <line x1="420" y1="-50" x2="440" y2="700" stroke="#fcd34d" strokeWidth="10" />

          {/* Secondary Arteries (White) */}
          <line x1="-50" y1="80" x2="1300" y2="90" stroke="#ffffff" strokeWidth="6" />
          <line x1="-50" y1="360" x2="1300" y2="380" stroke="#ffffff" strokeWidth="6" />
          <line x1="-50" y1="480" x2="1300" y2="490" stroke="#ffffff" strokeWidth="6" />

          <line x1="180" y1="-50" x2="190" y2="700" stroke="#ffffff" strokeWidth="6" />
          <line x1="720" y1="-50" x2="730" y2="700" stroke="#ffffff" strokeWidth="6" />
          <line x1="980" y1="-50" x2="990" y2="700" stroke="#ffffff" strokeWidth="6" />

          {/* Local Streets Grid */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="-50"
              y1={i * 55 + 20}
              x2="1300"
              y2={i * 55 + 25}
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 70 + 30}
              y1="-50"
              x2={i * 70 + 35}
              y2="700"
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
          ))}

          {/* District Labels */}
          <text x="160" y="140" fill="#4b5563" fontSize="11" fontWeight="600" letterSpacing="2">
            RIVERSIDE DISTRICT
          </text>
          <text x="500" y="195" fill="#4b5563" fontSize="12" fontWeight="700" letterSpacing="2">
            DOWNTOWN COMMERCIAL CORRIDOR
          </text>
          <text x="750" y="440" fill="#4b5563" fontSize="11" fontWeight="600" letterSpacing="2">
            EAST METRO PLAZA
          </text>
        </svg>
      </div>

      {/* Map Layer Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex items-center p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md">
          <button
            type="button"
            onClick={() => setMapType("standard")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mapType === "standard"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mapType === "satellite"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType("terrain")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              mapType === "terrain"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Terrain
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md overflow-hidden self-end">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b border-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discovery Compass Badge (Top Left) */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md text-xs font-bold text-slate-800">
        <Navigation2 className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
        <span>Live Radar • {businesses.length} Opportunities Identified</span>
      </div>

      {/* Business Pins on Map */}
      <div className="absolute inset-0 pointer-events-none">
        {businesses.map((biz, idx) => {
          const isSelected = selectedBusiness?.id === biz.id;

          // Spread out coordinates realistically across the viewport
          const positions = [
            { top: "28%", left: "34%" },
            { top: "38%", left: "56%" },
            { top: "54%", left: "22%" },
            { top: "62%", left: "68%" },
            { top: "22%", left: "74%" },
            { top: "72%", left: "42%" },
            { top: "45%", left: "82%" },
            { top: "18%", left: "18%" },
          ];

          const pos = positions[idx % positions.length];

          const isNoWebsite = biz.websiteStatus === "No Website";

          return (
            <div
              key={biz.id}
              style={{ top: pos.top, left: pos.left }}
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-300 z-10 hover:z-30"
              onClick={() => onSelectBusiness(biz)}
            >
              {/* Pin Container */}
              <div
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-lg transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-900 text-white scale-110 ring-4 ring-indigo-500/30 border-slate-800 z-30"
                    : isNoWebsite
                    ? "bg-white text-slate-900 border-rose-400 hover:scale-105"
                    : "bg-white text-slate-900 border-slate-300 hover:scale-105"
                }`}
              >
                {/* Opportunity Pulse */}
                {isNoWebsite && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] text-white font-bold items-center justify-center">
                      !
                    </span>
                  </span>
                )}

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? "bg-indigo-500 text-white"
                      : isNoWebsite
                      ? "bg-rose-50 text-rose-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <MapPin className="w-3 h-3 fill-current" />
                </div>

                <div className="flex flex-col text-left pr-0.5">
                  <span className="text-xs font-extrabold truncate max-w-[130px] leading-tight">
                    {biz.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{biz.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({biz.reviewCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Pin Arrow Tip */}
              <div
                className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1 border-r border-b ${
                  isSelected
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-300"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Selected Business Preview Floating Card (Bottom of Map) */}
      {selectedBusiness && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl z-20 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedBusiness.name}
                </h4>
                <WebsiteStatusBadge status={selectedBusiness.websiteStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedBusiness.category} • {selectedBusiness.location}
              </p>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{selectedBusiness.rating}</span>
              <span className="text-slate-400 font-normal">({selectedBusiness.reviewCount})</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
            {selectedBusiness.websiteAnalysis}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="text-xs text-slate-500 truncate flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedBusiness.phone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={selectedBusiness.alreadyAdded ? "secondary" : "primary"}
                size="sm"
                onClick={() => onAddLead(selectedBusiness)}
                leftIcon={
                  selectedBusiness.alreadyAdded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )
                }
              >
                {selectedBusiness.alreadyAdded ? "In CRM Leads" : "Add to CRM Leads"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
