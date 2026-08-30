"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useCRM } from "@/lib/context/crm-context";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LeadPipeline } from "@/components/dashboard/LeadPipeline";
import { TopNiches } from "@/components/dashboard/TopNiches";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/Button";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Users,
  CalendarCheck,
  Mail,
  MessageSquare,
  Plus,
  Compass,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const { leads, followUps, stats, openAddLead } = useCRM();

  // Dynamic real metrics from backend DB
  const totalLeadsCount = stats ? stats.totalLeads : leads.length;

  // Compute unique clients per channel & overall follow-ups sent strictly per Lead ID
  const metrics = useMemo(() => {
    const allOutreachedLeadIds = new Set<string>();
    const emailLeadIds = new Set<string>();
    const whatsappLeadIds = new Set<string>();
    const linkedinLeadIds = new Set<string>();
    const twitterLeadIds = new Set<string>();
    const instagramLeadIds = new Set<string>();
    const facebookLeadIds = new Set<string>();

    for (const lead of leads) {
      if (lead.activities && lead.activities.length > 0) {
        for (const act of lead.activities) {
          const ch = (act.channel as string).toLowerCase();
          allOutreachedLeadIds.add(lead.id);

          if (ch === "email") emailLeadIds.add(lead.id);
          else if (ch === "whatsapp") whatsappLeadIds.add(lead.id);
          else if (ch === "linkedin") linkedinLeadIds.add(lead.id);
          else if (ch === "twitter" || ch === "x") twitterLeadIds.add(lead.id);
          else if (ch === "instagram") instagramLeadIds.add(lead.id);
          else if (ch === "facebook") facebookLeadIds.add(lead.id);
        }
      }
    }

    for (const fu of followUps) {
      if (fu.leadId) {
        allOutreachedLeadIds.add(fu.leadId);
        const ch = (fu.channel as string).toLowerCase();

        if (ch === "email") emailLeadIds.add(fu.leadId);
        else if (ch === "whatsapp") whatsappLeadIds.add(fu.leadId);
        else if (ch === "linkedin") linkedinLeadIds.add(fu.leadId);
        else if (ch === "twitter" || ch === "x") twitterLeadIds.add(fu.leadId);
        else if (ch === "instagram") instagramLeadIds.add(fu.leadId);
        else if (ch === "facebook") facebookLeadIds.add(fu.leadId);
      }
    }

    return {
      totalFollowUpsSent:
        stats?.totalFollowUpsSent !== undefined
          ? Math.max(stats.totalFollowUpsSent, allOutreachedLeadIds.size)
          : allOutreachedLeadIds.size,
      emailCount:
        stats?.emailCount !== undefined
          ? Math.max(stats.emailCount, emailLeadIds.size)
          : emailLeadIds.size,
      whatsappCount:
        stats?.whatsappCount !== undefined
          ? Math.max(stats.whatsappCount, whatsappLeadIds.size)
          : whatsappLeadIds.size,
      linkedinCount:
        stats?.linkedinCount !== undefined
          ? Math.max(stats.linkedinCount, linkedinLeadIds.size)
          : linkedinLeadIds.size,
      twitterCount:
        stats?.twitterCount !== undefined
          ? Math.max(stats.twitterCount, twitterLeadIds.size)
          : twitterLeadIds.size,
      instagramCount:
        stats?.instagramCount !== undefined
          ? Math.max(stats.instagramCount, instagramLeadIds.size)
          : instagramLeadIds.size,
      facebookCount:
        stats?.facebookCount !== undefined
          ? Math.max(stats.facebookCount, facebookLeadIds.size)
          : facebookLeadIds.size,
    };
  }, [leads, followUps, stats]);

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Hero Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Multi-Channel Outreach Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Client Hunting & Conversion Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Find high-intent local businesses with no website or outdated tech, prepare personalized multi-channel outreach, and close more agency retainers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/lead-finder">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Compass className="w-4 h-4 text-indigo-600" />}
                className="bg-white hover:bg-slate-100 text-slate-900 shadow-md font-bold"
              >
                Find Businesses
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              onClick={() => openAddLead()}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-bold border border-indigo-400/30"
            >
              Add New Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Key Performance Metrics
          </h3>
          <span className="text-xs text-slate-400">Unique client counts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Total Leads"
            value={totalLeadsCount.toLocaleString()}
            change={totalLeadsCount > 0 ? `${totalLeadsCount} saved` : "0 saved"}
            changeType="increase"
            icon={<Users className="w-5 h-5 text-indigo-600" />}
            iconBgColor="bg-indigo-50 text-indigo-600"
            description="Active prospect pool"
            highlight
          />

          <KpiCard
            title="Total Follow-ups Sent"
            value={metrics.totalFollowUpsSent.toLocaleString()}
            change={
              metrics.totalFollowUpsSent > 0
                ? `${metrics.totalFollowUpsSent} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<CalendarCheck className="w-5 h-5 text-amber-600" />}
            iconBgColor="bg-amber-50 text-amber-600"
            description="Unique clients reached"
          />

          <KpiCard
            title="Email"
            value={metrics.emailCount.toLocaleString()}
            change={
              metrics.emailCount > 0 ? `${metrics.emailCount} clients` : "0 clients"
            }
            changeType="increase"
            icon={<Mail className="w-5 h-5 text-blue-600" />}
            iconBgColor="bg-blue-50 text-blue-600"
            description="Unique clients contacted"
          />

          <KpiCard
            title="WhatsApp"
            value={metrics.whatsappCount.toLocaleString()}
            change={
              metrics.whatsappCount > 0
                ? `${metrics.whatsappCount} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<MessageSquare className="w-5 h-5 text-emerald-600" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
            description="Unique clients contacted"
          />

          <KpiCard
            title="LinkedIn"
            value={metrics.linkedinCount.toLocaleString()}
            change={
              metrics.linkedinCount > 0
                ? `${metrics.linkedinCount} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />}
            iconBgColor="bg-sky-50 text-[#0A66C2]"
            description="Unique clients contacted"
          />

          <KpiCard
            title="Twitter / X"
            value={metrics.twitterCount.toLocaleString()}
            change={
              metrics.twitterCount > 0
                ? `${metrics.twitterCount} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<TwitterXIcon className="w-5 h-5 text-slate-800" />}
            iconBgColor="bg-slate-100 text-slate-800"
            description="Unique clients contacted"
          />

          <KpiCard
            title="Instagram"
            value={metrics.instagramCount.toLocaleString()}
            change={
              metrics.instagramCount > 0
                ? `${metrics.instagramCount} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<InstagramIcon className="w-5 h-5 text-[#E1306C]" />}
            iconBgColor="bg-rose-50 text-[#E1306C]"
            description="Unique clients contacted"
          />

          <KpiCard
            title="Facebook"
            value={metrics.facebookCount.toLocaleString()}
            change={
              metrics.facebookCount > 0
                ? `${metrics.facebookCount} clients`
                : "0 clients"
            }
            changeType="increase"
            icon={<FacebookIcon className="w-5 h-5 text-[#1877F2]" />}
            iconBgColor="bg-blue-50 text-[#1877F2]"
            description="Unique clients contacted"
          />
        </div>
      </section>

      {/* Visual Pipeline Section */}
      <section>
        <LeadPipeline />
      </section>

      {/* 2-Column Grid: Top Niches & Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <TopNiches />
        </div>
        <div className="lg:col-span-7">
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}
