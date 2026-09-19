"use client";

import React, { useState, useEffect } from "react";
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
import { LeadStatus, Channel, ActivityItem, WebsiteAuditItem, EmailVerificationResult, PhoneVerificationResult, FollowUpItem } from "@/lib/types";
import { toDhakaDateString, formatTime, formatDateTime, formatDate } from "@/lib/date-utils";
import { AuditDetailsModal } from "./AuditDetailsModal";
import { FollowUpDetailsModal } from "@/components/follow-ups/FollowUpDetailsModal";
import { VerificationStatusBadge } from "@/components/verification/VerificationStatusBadge";
import { EmailVerificationModal } from "@/components/verification/EmailVerificationModal";
import { PhoneVerificationModal } from "@/components/verification/PhoneVerificationModal";
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
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Bot,
  Loader2,
  Gauge,
  Zap,
  Smartphone,
  Layout,
  ShieldCheck,
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
    runChatGptAudit,
    runAutomaticAudit,
    senderGmails,
    updateLeadSenderEmail,
  } = useCRM();
  const { showToast } = useToast();

  const { isOpen, leadId } = activeLeadDetails;
  const lead = leads.find((l) => l.id === leadId);

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "followups" | "notes">("overview");
  const [editableNotes, setEditableNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Verification modals state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [selectedFollowUpForModal, setSelectedFollowUpForModal] = useState<FollowUpItem | null>(null);

  // Sender Gmail editing state
  const [isEditingSenderGmail, setIsEditingSenderGmail] = useState(false);
  const [senderGmailInput, setSenderGmailInput] = useState("");
  const [isSavingSenderGmail, setIsSavingSenderGmail] = useState(false);

  useEffect(() => {
    if (lead) {
      setSenderGmailInput(lead.originalSenderEmail || (senderGmails.length > 0 ? senderGmails[0] : ""));
    }
  }, [lead, senderGmails]);

  const handleSaveSenderGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    const clean = senderGmailInput.trim().toLowerCase();
    if (!clean) {
      showToast({
        type: "error",
        title: "Error",
        message: "Please select or enter a Gmail address.",
      });
      return;
    }
    setIsSavingSenderGmail(true);
    const success = await updateLeadSenderEmail(lead.id, clean);
    setIsSavingSenderGmail(false);
    if (success) {
      setIsEditingSenderGmail(false);
    }
  };

  // Activity modal/expand state
  const [expandedActivity, setExpandedActivity] = useState<ActivityItem | null>(null);
  const [isLoggingCustomActivity, setIsLoggingCustomActivity] = useState(false);
  const [customActivityType, setCustomActivityType] = useState("Phone call");
  const [customActivityChannel, setCustomActivityChannel] = useState<Channel | "call" | "note">("call");
  const [customActivityMessage, setCustomActivityMessage] = useState("");

  // Website Audit state
  const [audit, setAudit] = useState<WebsiteAuditItem | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  useEffect(() => {
    if (lead?.id && lead.website) {
      setIsLoadingAudit(true);
      fetch(`/api/audit?leadId=${lead.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.audit) setAudit(data.audit);
          else setAudit(null);
        })
        .catch((err) => console.error("Failed to load audit:", err))
        .finally(() => setIsLoadingAudit(false));
    } else {
      setAudit(null);
    }
  }, [lead?.id, lead?.website]);

  if (!isOpen || !lead) return null;

  const leadFollowUps = followUps.filter((f) => f.leadId === lead.id);

  const handleNotesSave = () => {
    updateLead(lead.id, { notes: editableNotes });
    setIsEditingNotes(false);
  };

  const handleRunAudit = async () => {
    if (!lead) return;
    setIsLoadingAudit(true);
    const res = await runAutomaticAudit(lead.id, !!audit);
    if (res) {
      setAudit(res);
    }
    setIsLoadingAudit(false);
  };

  const handleRunChatGpt = () => {
    if (!lead) return;
    runChatGptAudit(lead);
  };

  const handleLogCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActivityMessage.trim()) return;

    const todayStr = toDhakaDateString(new Date());
    const timeStr = formatTime(new Date());

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
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{lead.location}</span>
          </span>
          {lead.googleMapsUrl && (
            <a
              href={lead.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>View on Maps</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          <span>•</span>
          <span>{lead.niche}</span>
        </div>
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
              Website Health
            </span>
            <div className="flex items-center gap-1.5">
              <WebsiteStatusBadge status={lead.websiteStatus} />
              {lead.auditScore !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    lead.auditScore >= 80
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : lead.auditScore >= 50
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {lead.auditScore}/100
                </span>
              )}
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-slate-400 font-medium">Email Address</p>
                        {lead.email && (
                          <VerificationStatusBadge
                            status={lead.emailVerification?.status}
                            checkedAt={lead.emailVerification?.checkedAt}
                            size="sm"
                            type="email"
                            onClick={() => setEmailModalOpen(true)}
                          />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.email || "No email available"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.email && (
                      <button
                        onClick={() => setEmailModalOpen(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                      >
                        {lead.emailVerification ? "Verify Again" : "Verify"}
                      </button>
                    )}
                    {lead.email && (
                      <button
                        onClick={() => handleCopyField(lead.email || "", "Email")}
                        className="text-xs text-slate-500 hover:underline shrink-0"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* Sender Gmail Card (Displays which Gmail was used & allows updating ONLY sender Gmail) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">Outreach Sender Gmail</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.originalSenderEmail ? (
                          <span className="text-indigo-700 font-bold">{lead.originalSenderEmail}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not set / No email sent yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.originalSenderEmail && (
                      <button
                        onClick={() => handleCopyField(lead.originalSenderEmail || "", "Sender Gmail")}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Copy
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSenderGmailInput(lead.originalSenderEmail || (senderGmails[0] || ""));
                        setIsEditingSenderGmail(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      title="Update ONLY the sender Gmail"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{lead.originalSenderEmail ? "Update" : "Assign"}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Sender Gmail Editor */}
                {isEditingSenderGmail && (
                  <form
                    onSubmit={handleSaveSenderGmail}
                    className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5 sm:col-span-2 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Update Selected Sender Gmail (Client Email is untouched)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSenderGmail(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        {senderGmails.length > 0 ? (
                          <select
                            value={senderGmailInput}
                            onChange={(e) => setSenderGmailInput(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Select from configured Gmails --</option>
                            {senderGmails.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="email"
                            value={senderGmailInput}
                            onChange={(e) => setSenderGmailInput(e.target.value)}
                            placeholder="e.g. yourbusiness@gmail.com"
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isSavingSenderGmail}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="shrink-0 text-xs font-bold"
                      >
                        Save Sender Gmail
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Configure additional sender addresses anytime in <strong>Settings → Sender Gmail Accounts</strong>.
                    </p>
                  </form>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-slate-400 font-medium">WhatsApp / Phone</p>
                        {(lead.whatsapp || lead.phone) && (
                          <VerificationStatusBadge
                            status={lead.phoneVerification?.status}
                            checkedAt={lead.phoneVerification?.checkedAt}
                            size="sm"
                            type="phone"
                            onClick={() => setPhoneModalOpen(true)}
                          />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.whatsapp || lead.phone || "No phone available"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(lead.whatsapp || lead.phone) && (
                      <button
                        onClick={() => setPhoneModalOpen(true)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline font-semibold"
                      >
                        {lead.phoneVerification ? "Verify Again" : "Verify"}
                      </button>
                    )}
                    {(lead.whatsapp || lead.phone) && (
                      <button
                        onClick={() =>
                          handleCopyField(lead.whatsapp || lead.phone || "", "Phone number")
                        }
                        className="text-xs text-slate-500 hover:underline shrink-0"
                      >
                        Copy
                      </button>
                    )}
                  </div>
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

                {/* Location & Google Maps Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between sm:col-span-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">Business Location</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {lead.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.googleMapsUrl && (
                      <a
                        href={lead.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>View on Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyField(lead.location, "Location")}
                      className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Audit & Health Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Website Audit & Performance</h4>
                      {audit && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                            audit.overallScore >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : audit.overallScore >= 50
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {audit.overallScore}/100 Overall Score
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Technical SEO, speed, accessibility & conversion health
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRunChatGpt}
                    leftIcon={<Bot className="w-3.5 h-3.5 text-indigo-600" />}
                    className="hover:border-indigo-300 hover:bg-indigo-50/50"
                  >
                    ChatGPT Audit
                  </Button>

                  {lead.website ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleRunAudit}
                      disabled={isLoadingAudit}
                      leftIcon={
                        isLoadingAudit ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {isLoadingAudit
                        ? "Auditing..."
                        : audit
                        ? "Re-audit"
                        : "Run Auto Audit"}
                    </Button>
                  ) : null}
                </div>
              </div>

              {!lead.website ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No Website on File</p>
                  <p className="text-[11px] text-slate-500">
                    Add a website URL in the lead profile to unlock automatic audits and ChatGPT evaluations.
                  </p>
                </div>
              ) : isLoadingAudit && !audit ? (
                <div className="p-8 text-center space-y-3 bg-slate-50/70 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">
                    Running 18-Point Technical Website Audit...
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Testing SSL, HTTPS redirects, meta tags, H1 hierarchy, sample page links, speed, and mobile responsiveness.
                  </p>
                </div>
              ) : audit ? (
                <div className="space-y-4">
                  {/* Score breakdown metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Page Speed</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{audit.scores.pageSpeed}/100</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Lighthouse</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{audit.scores.lighthouse}/100</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Mobile</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{audit.scores.mobile}/100</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <Layout className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">UX / Design</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{audit.scores.uxTechnicalDesign}/100</p>
                    </div>
                  </div>

                  {/* Mini-Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Key Health Checks ({audit.checks.filter(c => c.status === "Passed").length}/{audit.checks.length} Passed)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAuditModalOpen(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                      >
                        <span>See Details & Fixes</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {audit.checks.slice(0, 8).map((chk) => (
                        <div
                          key={chk.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/60"
                        >
                          <span className="font-medium text-slate-700 truncate pr-2">{chk.label}</span>
                          <span className="shrink-0">
                            {chk.status === "Passed" ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Pass</span>
                              </span>
                            ) : chk.status === "Needs improvement" ? (
                              <span className="text-amber-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Warning</span>
                              </span>
                            ) : chk.status === "Failed" ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="text-[10px]">Fail</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">N/A</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer button */}
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditModalOpen(true)}
                      leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                    >
                      View Full Audit Report ({audit.problems.length} issues found)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                  <p className="text-xs text-slate-600">
                    This lead has a website (<strong className="text-slate-900">{lead.website}</strong>) but has not been audited yet.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleRunAudit}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Run 18-Point Technical Audit Now
                  </Button>
                </div>
              )}
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
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <ChannelIcon channel={act.channel} size="sm" />
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {act.type}
                          </span>
                          {act.outreachType && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {act.outreachType}
                            </span>
                          )}
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

                      {(act.senderEmail || (act.channel === "email" && lead.originalSenderEmail)) && (
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Sent from: <span className="text-indigo-600 font-semibold">{act.senderEmail || lead.originalSenderEmail}</span>
                        </p>
                      )}

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
                Scheduled Follow-up Cadences ({leadFollowUps.length})
              </span>
            </div>

            {leadFollowUps.length > 0 ? (
              <div className="space-y-3">
                {leadFollowUps.map((fu) => {
                  const isCompleted = fu.status === "completed" || (fu.currentStep !== undefined && fu.currentStep > 2);
                  const isOverdue = fu.status === "overdue";
                  const isToday = fu.status === "today";

                  return (
                    <div
                      key={fu.id}
                      className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                        isCompleted
                          ? "bg-slate-50 border-slate-200 opacity-80"
                          : isOverdue
                          ? "bg-white border-rose-200 shadow-2xs ring-1 ring-rose-500/10"
                          : isToday
                          ? "bg-white border-amber-200 shadow-2xs ring-1 ring-amber-500/10"
                          : "bg-white border-slate-200 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                              <ChannelIcon channel={fu.channel} size="sm" />
                              {fu.channel}
                            </span>

                            {/* Cadence Step Badge */}
                            {isCompleted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Completed (2/2)
                              </span>
                            ) : fu.currentStep === 2 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                2nd Follow-up
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                1st Follow-up
                              </span>
                            )}
                          </div>

                          <span className="text-xs font-bold text-slate-800 block">
                            Due: {fu.dueDate} {fu.dueTime ? `at ${fu.dueTime}` : ""}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : isOverdue
                              ? "bg-rose-100 text-rose-700"
                              : isToday
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {fu.status}
                        </span>
                      </div>

                      {/* Template & Subject info */}
                      {(fu.templateCategory || fu.templateName || fu.subject) && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                          {(fu.templateCategory || fu.templateName) && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500 font-medium">Template:</span>
                              <span className="font-semibold text-slate-800">
                                {fu.templateCategory || "Outreach"}
                              </span>
                              {fu.templateName && fu.templateName !== fu.templateCategory && (
                                <span className="text-indigo-600 font-medium">
                                  • {fu.templateName}
                                </span>
                              )}
                            </div>
                          )}

                          {fu.subject && (
                            <div className="flex items-center gap-1.5 text-slate-700 truncate">
                              <span className="text-slate-500 font-medium">Subject:</span>
                              <span className="font-semibold text-slate-900 truncate">
                                &quot;{fu.subject}&quot;
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reschedule Notice */}
                      {fu.isRescheduled && (
                        <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                          {fu.rescheduleNotice || "Rescheduled: Next follow-up adjusted dynamically."}
                        </p>
                      )}

                      {/* Preview notes */}
                      <p className="text-xs text-slate-600 font-mono line-clamp-2">
                        {fu.notes || fu.originalMessagePreview}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedFollowUpForModal(fu)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Audit & History Log</span>
                        </button>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openOutreach(lead, fu.channel, undefined, true)}
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          {isCompleted
                            ? "New Outreach"
                            : fu.currentStep === 2
                            ? "Send 2nd Follow-up"
                            : "Send 1st Follow-up"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Website Audit Details Modal */}
      <AuditDetailsModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        audit={audit}
        businessName={lead.businessName}
        website={lead.website}
        category={lead.niche}
        location={lead.location}
        onReAudit={handleRunAudit}
        onRunChatGpt={handleRunChatGpt}
        isAuditing={isLoadingAudit}
      />

      {/* Email Verification Modal */}
      {lead.email && (
        <EmailVerificationModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          email={lead.email}
          leadId={lead.id}
          initialResult={lead.emailVerification}
          onVerificationComplete={(result) => {
            updateLead(lead.id, {
              emailVerification: result,
            });
          }}
        />
      )}

      {/* Phone Verification Modal */}
      {(lead.whatsapp || lead.phone) && (
        <PhoneVerificationModal
          isOpen={phoneModalOpen}
          onClose={() => setPhoneModalOpen(false)}
          phone={lead.whatsapp || lead.phone || ""}
          leadId={lead.id}
          initialResult={lead.phoneVerification}
          onVerificationComplete={(result) => {
            updateLead(lead.id, {
              phoneVerification: result,
            });
          }}
        />
      )}

      {/* Follow-up Details & History Audit Modal */}
      {selectedFollowUpForModal && (
        <FollowUpDetailsModal
          isOpen={Boolean(selectedFollowUpForModal)}
          onClose={() => setSelectedFollowUpForModal(null)}
          followUp={selectedFollowUpForModal}
          lead={lead}
          onContinueOutreach={() => {
            const ch = selectedFollowUpForModal.channel;
            setSelectedFollowUpForModal(null);
            openOutreach(lead, ch, undefined, true);
          }}
        />
      )}
    </Drawer>
  );
}
