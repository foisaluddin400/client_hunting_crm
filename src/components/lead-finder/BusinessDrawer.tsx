"use client";

import React from "react";
import { MapBusiness } from "@/lib/types";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { WebsiteStatusBadge } from "@/components/ui/Badge";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Mail,
  MessageSquare,
  Plus,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
} from "lucide-react";

interface BusinessDrawerProps {
  business: MapBusiness | null;
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (business: MapBusiness) => void;
}

export function BusinessDrawer({
  business,
  isOpen,
  onClose,
  onAddLead,
}: BusinessDrawerProps) {
  if (!business || !isOpen) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex items-center gap-2">
          <span className="truncate">{business.name}</span>
          {business.verified && (
            <ShieldCheck className="w-4 h-4 text-indigo-600 fill-indigo-100" />
          )}
        </div>
      }
      subtitle={
        <span>
          {business.category} • {business.location}
        </span>
      }
      headerActions={
        <Button
          variant={business.alreadyAdded ? "secondary" : "primary"}
          size="sm"
          onClick={() => onAddLead(business)}
          disabled={business.alreadyAdded}
          leftIcon={
            business.alreadyAdded ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )
          }
        >
          {business.alreadyAdded ? "Added to CRM" : "+ Add to CRM Leads"}
        </Button>
      }
    >
      <div className="p-6 space-y-6">
        {/* Rating & Opportunity Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-xl text-amber-900 font-extrabold text-sm border border-amber-200/60">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{business.rating}</span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-800">{business.reviewCount} Google Reviews</span>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {business.isOpenNow ? "● Open Now" : "○ Closed"}
              </p>
            </div>
          </div>

          <div>
            <WebsiteStatusBadge status={business.websiteStatus} />
          </div>
        </div>

        {/* Opportunity Analysis Box */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Pitch Opportunity Assessment</span>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed font-medium">
            {business.websiteAnalysis}
          </p>
        </div>

        {/* Location & Address */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Business Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Address</p>
                <p className="font-semibold text-slate-800">{business.address}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Direct Phone</p>
                <p className="font-semibold text-slate-800">{business.phone}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Decision Maker / Owner</p>
                <p className="font-semibold text-slate-800">
                  {business.ceoName || "Not listed on Maps"}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Official Website</p>
                <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                  {business.website || "None (High Opportunity)"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Presences Discovered */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Discovered Online Channels
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                business.email
                  ? "bg-indigo-50/60 border-indigo-200 text-indigo-950"
                  : "bg-slate-50 border-slate-200 opacity-40"
              }`}
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold">Email</span>
              <span className="text-[10px] text-slate-500">
                {business.email ? "Found" : "Missing"}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                business.whatsapp
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                  : "bg-slate-50 border-slate-200 opacity-40"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">WhatsApp</span>
              <span className="text-[10px] text-slate-500">
                {business.whatsapp ? "Available" : "Missing"}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                business.twitter
                  ? "bg-zinc-100 border-zinc-200 text-zinc-950"
                  : "bg-slate-50 border-slate-200 opacity-40"
              }`}
            >
              <TwitterXIcon className="w-4 h-4 text-slate-900" />
              <span className="text-xs font-semibold">Twitter/X</span>
              <span className="text-[10px] text-slate-500">
                {business.twitter ? "Active" : "Missing"}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                business.instagram
                  ? "bg-pink-50/60 border-pink-200 text-pink-950"
                  : "bg-slate-50 border-slate-200 opacity-40"
              }`}
            >
              <InstagramIcon className="w-4 h-4 text-[#E1306C]" />
              <span className="text-xs font-semibold">Instagram</span>
              <span className="text-[10px] text-slate-500">
                {business.instagram ? "Active" : "Missing"}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                business.facebook
                  ? "bg-blue-50/60 border-blue-200 text-blue-950"
                  : "bg-slate-50 border-slate-200 opacity-40"
              }`}
            >
              <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
              <span className="text-xs font-semibold">Facebook</span>
              <span className="text-[10px] text-slate-500">
                {business.facebook ? "Active" : "Missing"}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Footer inside Drawer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Inspector
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => onAddLead(business)}
            disabled={business.alreadyAdded}
            leftIcon={
              business.alreadyAdded ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Plus className="w-4 h-4" />
              )
            }
          >
            {business.alreadyAdded ? "Already in CRM Leads" : "+ Import to CRM Leads"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
