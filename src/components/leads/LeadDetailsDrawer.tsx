"use client";

import React, { useState } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Textarea, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  LeadStatusBadge,
  WebsiteStatusBadge,
  ChannelIcon,
} from "@/components/ui/Badge";
import { LeadStatus, Channel, ActivityItem } from "@/lib/types";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Building2,
  User,
  MapPin,
  Globe,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Send,
  ExternalLink,
  Phone,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/lib/context/toast-context";

export function LeadDetailsDrawer() {
  const {
    activeLeadDetails,
    closeLeadDetails,
    leads,
    updateLead,
    updateLeadStatus,
    logActivity,
    deleteActivity,
    openOutreach,
    openAddLead,
    openDeleteConfirm,
    followUps,
  } = useCRM();
  const { showToast } = useToast();

  const { isOpen, leadId } = activeLeadDetails;
  const lead = leads.find((l) => l.id === leadId);

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "followups" | "notes">("overview");
  const [editableNotes, setEditableNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Activity modal/expand state
  const [expandedActivity, setExpandedActivity] = useState<ActivityItem | null>(null);
  const [isLoggingCustomActivity, setIsLoggingCustomActivity] = useState(false);
  const [customActivityType, setCustomActivityType] = useState("Phone call");
  const [customActivityChannel, setCustomActivityChannel] = useState<Channel | "call" | "note">("call");
  const [customActivityMessage, setCustomActivityMessage] = useState("");

  if (!isOpen || !lead) return null;

  const leadFollowUps = followUps.filter((f) => f.leadId === lead.id);

  const handleNotesSave = () => {
    updateLead(lead.id, { notes: editableNotes });
    setIsEditingNotes(false);
  };

  const handleLogCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActivityMessage.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    logActivity(lead.id, {
      channel: customActivityChannel,
      type: customActivityType,
      date: todayStr,
      time: timeStr,
      messagePreview: customActivityMessage.substring(0, 100) + (customActivityMessage.length > 100 ? "..." : ""),
      fullMessage: customActivityMessage,
      status: "Completed",
    });

    setCustomActivityMessage("");
    setIsLoggingCustomActivity(false);
    showToast({
      type: "success",
      title: "Activity Logged",
      message: `${customActivityType} recorded in lead timeline.`,
    });
  };

  const handleCopyField = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast({
        type: "success",
        title: "Copied to Clipboard",
        message: `${label} copied.`,
        duration: 2000,
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeLeadDetails}
      width="2xl"
      title={
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg ${lead.avatarColor || "bg-indigo-600"} text-white flex items-center justify-center font-bold text-sm`}
          >
            {lead.businessName.charAt(0)}
          </div>
          <span className="truncate">{lead.businessName}</span>
        </div>
      }
      subtitle={
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          {lead.location} • {lead.niche}
        </span>
      }
      headerActions={
        <div className="flex items-center gap-1.5 mr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddLead(lead, "edit", lead.id)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDeleteConfirm(lead.id, lead.businessName)}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Top Status & Score Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pipeline Stage
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={lead.status}
                onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                className="py-1 text-xs font-semibold bg-white border-slate-300 w-36"
              >
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Contacted">Contacted</option>
                <option value="Replied">Replied</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Meeting">Meeting</option>
                <option value="Proposal">Proposal</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </Select>
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Lead Score
            </span>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${
                    lead.leadScore >= 85
                      ? "bg-emerald-500"
                      : lead.leadScore >= 70
                      ? "bg-indigo-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${lead.leadScore}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-800">
                {lead.leadScore}/100
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Website Audit
            </span>
            <div>
              <WebsiteStatusBadge status={lead.websiteStatus} />
            </div>
          </div>
        </div>

        {/* Quick Outreach Action Bar */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Launch Quick Outreach:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {lead.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "email")}
                leftIcon={<Mail className="w-4 h-4 text-indigo-600" />}
                className="hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                Email Client
              </Button>
            )}

            {(lead.whatsapp || lead.phone) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "whatsapp")}
                leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                className="hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                WhatsApp
              </Button>
            )}

            {lead.linkedin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "linkedin")}
                leftIcon={<LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />}
                className="hover:border-sky-300 hover:bg-sky-50/50"
              >
                LinkedIn
              </Button>
            )}

            {lead.instagram && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "instagram")}
                leftIcon={<InstagramIcon className="w-4 h-4 text-[#E1306C]" />}
                className="hover:border-pink-300 hover:bg-pink-50/50"
              >
                Instagram DM
              </Button>
            )}

            {lead.facebook && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "facebook")}
                leftIcon={<FacebookIcon className="w-4 h-4 text-[#1877F2]" />}
                className="hover:border-blue-300 hover:bg-blue-50/50"
              >
                Facebook
              </Button>
            )}

            {lead.twitter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOutreach(lead, "twitter")}
                leftIcon={<TwitterXIcon className="w-4 h-4 text-slate-800" />}
                className="hover:border-slate-300 hover:bg-slate-50"
              >
                Twitter/X
              </Button>
            )}
          </div>
        </div>

        {/* Tabs: Overview, Timeline, Follow-ups, Notes */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === "overview"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Business Overview
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === "timeline"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Outreach Timeline</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
                {lead.activities?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("followups")}
              className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === "followups"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Follow-ups</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
                {leadFollowUps.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("notes");
                setEditableNotes(lead.notes || "");
              }}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === "notes"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Notes
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Contact Information Cards */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Contact & Decision Maker
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">CEO / Founder</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.ceoName || "Not identified yet"}
                      </p>
                    </div>
                  </div>
                  {lead.ceoName && (
                    <button
                      onClick={() => handleCopyField(lead.ceoName || "", "CEO Name")}
                      className="text-xs text-indigo-600 hover:underline shrink-0"
                    >
                      Copy
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">Email Address</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.email || "No email available"}
                      </p>
                    </div>
                  </div>
                  {lead.email && (
                    <button
                      onClick={() => handleCopyField(lead.email || "", "Email")}
                      className="text-xs text-indigo-600 hover:underline shrink-0"
                    >
                      Copy
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">WhatsApp / Phone</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.whatsapp || lead.phone || "No phone available"}
                      </p>
                    </div>
                  </div>
                  {(lead.whatsapp || lead.phone) && (
                    <button
                      onClick={() =>
                        handleCopyField(lead.whatsapp || lead.phone || "", "Phone number")
                      }
                      className="text-xs text-indigo-600 hover:underline shrink-0"
                    >
                      Copy
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">Website</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.website || "None (Opportunity!)"}
                      </p>
                    </div>
                  </div>
                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Social Profiles Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Social Profiles & Presences
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                    lead.linkedin
                      ? "bg-sky-50/60 border-sky-200 text-sky-950"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />
                  <span className="text-xs font-semibold">LinkedIn</span>
                  <span className="text-[10px] text-slate-500">
                    {lead.linkedin ? "Connected" : "Not on file"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                    lead.instagram
                      ? "bg-pink-50/60 border-pink-200 text-pink-950"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <InstagramIcon className="w-5 h-5 text-[#E1306C]" />
                  <span className="text-xs font-semibold">Instagram</span>
                  <span className="text-[10px] text-slate-500">
                    {lead.instagram ? "Connected" : "Not on file"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                    lead.facebook
                      ? "bg-blue-50/60 border-blue-200 text-blue-950"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                  <span className="text-xs font-semibold">Facebook</span>
                  <span className="text-[10px] text-slate-500">
                    {lead.facebook ? "Connected" : "Not on file"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 ${
                    lead.twitter
                      ? "bg-zinc-100 border-zinc-200 text-zinc-950"
                      : "bg-slate-50 border-slate-200 opacity-50"
                  }`}
                >
                  <TwitterXIcon className="w-5 h-5 text-slate-900" />
                  <span className="text-xs font-semibold">Twitter/X</span>
                  <span className="text-[10px] text-slate-500">
                    {lead.twitter ? "Connected" : "Not on file"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Notes preview */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Lead Intelligence Notes</span>
                </span>
                <button
                  onClick={() => {
                    setActiveTab("notes");
                    setIsEditingNotes(true);
                  }}
                  className="text-xs text-amber-700 hover:underline font-semibold"
                >
                  Edit Notes
                </button>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                {lead.notes || "No notes logged yet. Click to add your observations."}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Outreach Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Activity History ({lead.activities?.length || 0})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoggingCustomActivity(!isLoggingCustomActivity)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Log Activity / Call
              </Button>
            </div>

            {/* Manual Activity Logger Form */}
            {isLoggingCustomActivity && (
              <form
                onSubmit={handleLogCustomActivity}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Channel / Type"
                    value={customActivityChannel}
                    onChange={(e) => setCustomActivityChannel(e.target.value as any)}
                  >
                    <option value="call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="note">Note / Meeting</option>
                  </Select>

                  <Input
                    label="Activity Title"
                    value={customActivityType}
                    onChange={(e) => setCustomActivityType(e.target.value)}
                    placeholder="e.g. Discovery Zoom call"
                  />
                </div>

                <Textarea
                  label="Details / Outcome"
                  value={customActivityMessage}
                  onChange={(e) => setCustomActivityMessage(e.target.value)}
                  placeholder="Summarize key takeaways, client questions, or next steps..."
                  rows={2}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setIsLoggingCustomActivity(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Activity
                  </Button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {lead.activities && lead.activities.length > 0 ? (
                lead.activities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Dot on line */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChannelIcon channel={act.channel} size="sm" />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {act.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {act.date} {act.time ? `• ${act.time}` : ""}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-50 text-indigo-700">
                            {act.status}
                          </span>
                          <button
                            onClick={() => deleteActivity(lead.id, act.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {act.messagePreview && (
                        <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100">
                          {act.messagePreview}
                        </p>
                      )}

                      {act.fullMessage && act.fullMessage !== act.messagePreview && (
                        <button
                          onClick={() => setExpandedActivity(act)}
                          className="text-[11px] text-indigo-600 hover:underline font-semibold mt-2 inline-block"
                        >
                          View Full Message &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-4">
                  No outreach or activities recorded yet. Launch an outreach message to begin the timeline!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Follow-ups */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Scheduled Follow-up Reminders
              </span>
            </div>

            {leadFollowUps.length > 0 ? (
              <div className="space-y-2.5">
                {leadFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={fu.channel} size="sm" />
                        <span className="text-xs font-bold text-slate-800">
                          Due: {fu.dueDate} {fu.dueTime ? `at ${fu.dueTime}` : ""}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            fu.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : fu.status === "overdue"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {fu.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {fu.notes || fu.originalMessagePreview}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openOutreach(lead, fu.channel)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Outreach
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                No active follow-ups for this lead.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Notes */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <Textarea
              label="Private Agency Notes & Next Steps"
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              rows={8}
              placeholder="Add key insights, custom budget ranges, gatekeeper names, objection handling notes..."
              className="text-xs leading-relaxed"
            />
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleNotesSave}>
                Save Notes
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Activity Modal */}
      {expandedActivity && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {expandedActivity.type} ({expandedActivity.date})
              </h4>
              <button
                onClick={() => setExpandedActivity(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-80 overflow-y-auto">
              {expandedActivity.fullMessage}
            </pre>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedActivity(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
