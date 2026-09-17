"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { Channel, Lead } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { copyToClipboard, replaceTemplateVariables } from "@/lib/utils";
import { normalizeCategory } from "@/lib/transformers";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Calendar,
  Info,
  Lock,
  Tag,
  Repeat,
} from "lucide-react";

export const OUTREACH_CATEGORIES = [
  "No Website",
  "Website Redesign",
  "SEO Improvement",
  "Booking System",
  "Custom Website",
  "Mobile App",
  "General Introduction",
] as const;

export function OutreachModal() {
  const {
    activeOutreach,
    closeOutreach,
    templates,
    logActivity,
    updateLead,
    addFollowUp,
    userProfile,
    senderGmails,
    followUps,
  } = useCRM();
  const { showToast } = useToast();

  const {
    isOpen,
    lead,
    channel = "email",
    defaultMessage = "",
    isFollowUp = false,
  } = activeOutreach;

  const [selectedChannel, setSelectedChannel] = useState<Channel>(channel);
  const [activeCategory, setActiveCategory] = useState<string>("No Website");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedSenderGmail, setSelectedSenderGmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [scheduleFollowUpDays, setScheduleFollowUpDays] = useState<string>("3");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Independent copy feedback tracking
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Find active follow-up for this lead & channel
  const activeFollowUp = useMemo(() => {
    if (!lead) return null;
    return (
      followUps.find(
        (fu) =>
          fu.leadId === lead.id &&
          fu.channel === selectedChannel &&
          fu.status !== "completed"
      ) || null
    );
  }, [followUps, lead, selectedChannel]);

  const followUpNumber: 1 | 2 = useMemo(() => {
    if (!activeFollowUp) return 1;
    if (activeFollowUp.firstFollowUpSentAt || activeFollowUp.currentStep === 2) {
      return 2;
    }
    return 1;
  }, [activeFollowUp]);

  // English forecast for scheduling intervals
  const reminderForecast = useMemo(() => {
    if (scheduleFollowUpDays === "none") return null;
    const days = parseInt(scheduleFollowUpDays, 10);
    const now = new Date();
    const d1 = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const d2 = new Date(now.getTime() + days * 2 * 24 * 60 * 60 * 1000);
    const formatOpts: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    return {
      firstDate: new Intl.DateTimeFormat("en-US", formatOpts).format(d1),
      secondDate: new Intl.DateTimeFormat("en-US", formatOpts).format(d2),
    };
  }, [scheduleFollowUpDays]);

  // Filter templates for current selection
  const availableTemplates = useMemo(() => {
    if (isFollowUp) {
      return templates.filter((t) => normalizeCategory(t.category) === "Follow-up");
    }
    return templates.filter((t) => normalizeCategory(t.category) === activeCategory);
  }, [templates, isFollowUp, activeCategory]);

  // Sync state when active outreach opens or lead changes
  useEffect(() => {
    if (isOpen && lead) {
      const initChannel = channel || (lead.email ? "email" : "whatsapp");
      setSelectedChannel(initChannel);

      // Determine sender Gmail
      if (isFollowUp) {
        // Requirement 3: Locked to original first outreach Gmail
        const originalSender =
          lead.originalSenderEmail ||
          senderGmails[0] ||
          userProfile.email ||
          "";
        setSelectedSenderGmail(originalSender);
      } else {
        const defaultSender =
          lead.originalSenderEmail ||
          (senderGmails.length > 0 ? senderGmails[0] : userProfile.email || "");
        setSelectedSenderGmail(defaultSender);
      }

      // Determine active category
      let initialCategory = "No Website";
      if (isFollowUp) {
        // Requirement 6: Display exact original outreach type
        initialCategory =
          lead.originalOutreachType ||
          (lead.websiteStatus === "Redesign"
            ? "Website Redesign"
            : lead.websiteStatus === "SEO Performance"
            ? "SEO Improvement"
            : "No Website");
      } else {
        if (lead.websiteStatus === "No Website") {
          initialCategory = "No Website";
        } else if (lead.websiteStatus === "Redesign") {
          initialCategory = "Website Redesign";
        } else if (lead.websiteStatus === "SEO Performance") {
          initialCategory = "SEO Improvement";
        } else {
          initialCategory = "General Introduction";
        }
      }
      setActiveCategory(initialCategory);

      // Find matching templates
      const matchingTemplates = isFollowUp
        ? templates.filter((t) => normalizeCategory(t.category) === "Follow-up")
        : templates.filter((t) => normalizeCategory(t.category) === initialCategory);

      const tpl = matchingTemplates[0] || templates[0];
      if (tpl) {
        setSelectedTemplateId(tpl.id);
        const replacedSubject = replaceTemplateVariables(tpl.subject || "", {
          businessName: lead.businessName,
          ceoName: lead.ceoName,
          niche: lead.niche,
          location: lead.location,
          senderName: userProfile.name,
          agencyName: userProfile.agencyName,
        });
        const replacedBody = replaceTemplateVariables(tpl.body, {
          businessName: lead.businessName,
          ceoName: lead.ceoName,
          niche: lead.niche,
          location: lead.location,
          senderName: userProfile.name,
          agencyName: userProfile.agencyName,
        });
        setSubject(replacedSubject);
        setMessage(defaultMessage || replacedBody);
      } else {
        setMessage(defaultMessage || "");
      }
    }
    setCopiedField(null);
  }, [isOpen, lead, channel, defaultMessage, isFollowUp, templates, userProfile, senderGmails]);

  if (!isOpen || !lead) return null;

  // Handle category change (for 7 outreach categories in non-followup mode)
  const handleCategoryChange = (newCat: string) => {
    setActiveCategory(newCat);
    const catTemplates = templates.filter(
      (t) => normalizeCategory(t.category) === newCat
    );
    const firstTpl = catTemplates[0];
    if (firstTpl) {
      setSelectedTemplateId(firstTpl.id);
      applyTemplate(firstTpl);
    } else {
      setSelectedTemplateId("");
    }
  };

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      applyTemplate(tpl);
    }
  };

  const applyTemplate = (tpl: any) => {
    const replacedSubject = replaceTemplateVariables(tpl.subject || "", {
      businessName: lead.businessName,
      ceoName: lead.ceoName,
      niche: lead.niche,
      location: lead.location,
      senderName: userProfile.name,
      agencyName: userProfile.agencyName,
    });
    const replacedBody = replaceTemplateVariables(tpl.body, {
      businessName: lead.businessName,
      ceoName: lead.ceoName,
      niche: lead.niche,
      location: lead.location,
      senderName: userProfile.name,
      agencyName: userProfile.agencyName,
    });
    setSubject(replacedSubject);
    setMessage(replacedBody);
  };

  // Dedicated separate clipboard copy handler
  const handleCopySeparate = async (text: string, fieldId: string, label: string) => {
    if (!text) {
      showToast({
        type: "error",
        title: "Nothing to Copy",
        message: `${label} is empty.`,
      });
      return;
    }
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2500);
      showToast({
        type: "success",
        title: "Copied Separately",
        message: `${label} copied to your clipboard.`,
        duration: 2000,
      });
    }
  };

  // Schedule follow-up helper for original outreach
  const maybeScheduleFollowUp = async () => {
    if (!isFollowUp && scheduleFollowUpDays !== "none") {
      const days = parseInt(scheduleFollowUpDays, 10);
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + days);
      const dueDateStr = followUpDate.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      const selectedTpl = templates.find((t) => t.id === selectedTemplateId);

      await addFollowUp({
        leadId: lead.id,
        businessName: lead.businessName,
        contactPerson: lead.ceoName || lead.businessName,
        channel: selectedChannel,
        originalMessagePreview: message.substring(0, 100),
        dueDate: dueDateStr,
        dueTime: "10:00 AM",
        status: "upcoming",
        priority: "medium",
        intervalDays: days,
        currentStep: 1,
        originalMessageDate: todayStr,
        templateCategory: activeCategory,
        templateName: selectedTpl?.name || activeCategory,
        subject: selectedChannel === "email" ? subject : undefined,
        notes: `1st Follow-up scheduled (${days}-day interval)`,
      });
    }
  };

  // Channel configuration for other social/messaging channels
  const channelDetails: Record<
    Channel,
    {
      title: string;
      icon: React.ReactNode;
      recipientLabel: string;
      recipientValue: string;
      buttonLabel: string;
      buttonVariant: "primary" | "whatsapp" | "linkedin" | "email";
      actionUrl: string;
    }
  > = {
    email: {
      title: isFollowUp ? "Follow-up Email Outreach" : "Email Outreach",
      icon: <Mail className="w-5 h-5 text-indigo-600" />,
      recipientLabel: "To (Client Gmail):",
      recipientValue: lead.email || "No email on file",
      buttonLabel: "Copy & Save",
      buttonVariant: "primary",
      actionUrl: "",
    },
    whatsapp: {
      title: "WhatsApp Outreach",
      icon: <MessageSquare className="w-5 h-5 text-[#25D366]" />,
      recipientLabel: "To (WhatsApp Number):",
      recipientValue: lead.whatsapp || lead.phone || "No phone on file",
      buttonLabel: "Copy & Open WhatsApp",
      buttonVariant: "whatsapp",
      actionUrl: `https://wa.me/${(lead.whatsapp || lead.phone || "").replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(message)}`,
    },
    linkedin: {
      title: "LinkedIn Outreach",
      icon: <LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />,
      recipientLabel: "Profile:",
      recipientValue:
        lead.linkedin ||
        `linkedin.com/search/results/all/?keywords=${encodeURIComponent(
          lead.ceoName || lead.businessName
        )}`,
      buttonLabel: "Copy & Open LinkedIn",
      buttonVariant: "linkedin",
      actionUrl:
        lead.linkedin ||
        `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(
          lead.ceoName || lead.businessName
        )}`,
    },
    instagram: {
      title: "Instagram DM Outreach",
      icon: <InstagramIcon className="w-5 h-5 text-[#E1306C]" />,
      recipientLabel: "Profile:",
      recipientValue: lead.instagram || "instagram.com",
      buttonLabel: "Copy & Open Instagram",
      buttonVariant: "primary",
      actionUrl: lead.instagram || "https://instagram.com",
    },
    facebook: {
      title: "Facebook Messenger Outreach",
      icon: <FacebookIcon className="w-5 h-5 text-[#1877F2]" />,
      recipientLabel: "Profile / Page:",
      recipientValue: lead.facebook || "facebook.com",
      buttonLabel: "Copy & Open Facebook",
      buttonVariant: "primary",
      actionUrl: lead.facebook || "https://facebook.com",
    },
    twitter: {
      title: "Twitter / X DM Outreach",
      icon: <TwitterXIcon className="w-5 h-5 text-slate-900" />,
      recipientLabel: "Profile:",
      recipientValue: lead.twitter || "x.com",
      buttonLabel: "Copy & Open Twitter/X",
      buttonVariant: "primary",
      actionUrl: lead.twitter || "https://x.com",
    },
  };

  const currentChannelConfig = channelDetails[selectedChannel];

  // Action: Copy & Save for Email (NO external navigation)
  const handleCopyAndSaveEmail = async () => {
    setIsSubmitting(true);

    // Copy message to clipboard automatically as part of Copy & Save
    await copyToClipboard(message);

    const senderToUse = isFollowUp
      ? (lead.originalSenderEmail || selectedSenderGmail)
      : selectedSenderGmail;

    const categoryToUse = isFollowUp
      ? (activeFollowUp?.templateCategory || lead.originalOutreachType || activeCategory)
      : activeCategory;

    const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
    const templateNameToUse = selectedTpl?.name || (isFollowUp ? activeFollowUp?.templateName : undefined);

    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Record outreach activity in DB
    await logActivity(lead.id, {
      channel: "email",
      type: isFollowUp
        ? `Email ${followUpNumber === 1 ? "1st" : "2nd"} follow-up prepared`
        : "Email outreach prepared",
      date: todayStr,
      time: timeStr,
      messagePreview: message.substring(0, 120) + (message.length > 120 ? "..." : ""),
      fullMessage: message,
      status: "Prepared",
      senderEmail: senderToUse,
      outreachType: categoryToUse,
      templateCategory: categoryToUse,
      templateName: templateNameToUse,
      subject: subject,
      followUpNumber: isFollowUp ? followUpNumber : undefined,
      intervalDays: scheduleFollowUpDays !== "none" ? parseInt(scheduleFollowUpDays, 10) : undefined,
    });

    // Update lead original sender email and outreach type if not already set
    const leadUpdates: Partial<Lead> = {};
    if (!lead.originalSenderEmail && senderToUse) {
      leadUpdates.originalSenderEmail = senderToUse;
    }
    if (!lead.originalOutreachType && categoryToUse) {
      leadUpdates.originalOutreachType = categoryToUse;
    }
    if (Object.keys(leadUpdates).length > 0) {
      await updateLead(lead.id, leadUpdates);
    }

    // Schedule follow-up if original outreach
    if (!isFollowUp) {
      await maybeScheduleFollowUp();
    }

    showToast({
      type: "success",
      title: isFollowUp
        ? `${followUpNumber === 1 ? "1st" : "2nd"} Follow-up Saved! 🚀`
        : "Copied & Saved! 🚀",
      message: `Outreach saved with sender ${senderToUse || "default"}. Message copied to clipboard.`,
      duration: 4000,
    });

    setIsSubmitting(false);
    closeOutreach();
  };

  // Action for other channels (WhatsApp, LinkedIn, etc.): Copy message & Open external channel client/URL
  const handleCopyAndOpenOtherChannel = async () => {
    setIsSubmitting(true);

    await copyToClipboard(message);

    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
    const categoryToUse = isFollowUp
      ? (activeFollowUp?.templateCategory || lead.originalOutreachType || activeCategory)
      : activeCategory;
    const templateNameToUse = selectedTpl?.name || (isFollowUp ? activeFollowUp?.templateName : undefined);

    // Record activity as PREPARED
    await logActivity(lead.id, {
      channel: selectedChannel,
      type: isFollowUp
        ? `${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)} ${followUpNumber === 1 ? "1st" : "2nd"} follow-up prepared`
        : `${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)} outreach prepared`,
      date: todayStr,
      time: timeStr,
      messagePreview: message.substring(0, 120) + (message.length > 120 ? "..." : ""),
      fullMessage: message,
      status: "Prepared",
      outreachType: categoryToUse,
      templateCategory: categoryToUse,
      templateName: templateNameToUse,
      followUpNumber: isFollowUp ? followUpNumber : undefined,
      intervalDays: scheduleFollowUpDays !== "none" ? parseInt(scheduleFollowUpDays, 10) : undefined,
    });

    // Schedule follow-up if original outreach
    if (!isFollowUp) {
      await maybeScheduleFollowUp();
    }

    showToast({
      type: "success",
      title: isFollowUp
        ? `${followUpNumber === 1 ? "1st" : "2nd"} Follow-up Saved! 🚀`
        : "Message Copied & Activity Saved! 🚀",
      message: `Activity saved. Opening ${selectedChannel}...`,
      duration: 4000,
    });

    setIsSubmitting(false);

    // Open link in external tab safely
    if (currentChannelConfig.actionUrl) {
      window.open(currentChannelConfig.actionUrl, "_blank", "noopener,noreferrer");
    }

    closeOutreach();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeOutreach}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          {currentChannelConfig.icon}
          <span>
            {isFollowUp
              ? `${followUpNumber === 1 ? "1st" : "2nd"} Follow-up Composer`
              : "Outreach Composer"}{" "}
            — {lead.businessName}
          </span>
          {isFollowUp && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {followUpNumber === 1 ? "1st Follow-up" : "2nd Follow-up"}
            </span>
          )}
        </div>
      }
      description={`Target contact: ${lead.ceoName || lead.businessName} • ${lead.location}`}
    >
      <div className="space-y-4">
        {/* Channel Selector Switcher (Hidden if locked in follow-up mode or switchable) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/60">
          {(["email", "whatsapp", "linkedin", "instagram", "facebook", "twitter"] as Channel[]).map(
            (ch) => {
              const active = selectedChannel === ch;
              const hasContact =
                ch === "email"
                  ? !!lead.email
                  : ch === "whatsapp"
                  ? !!(lead.whatsapp || lead.phone)
                  : ch === "linkedin"
                  ? !!lead.linkedin
                  : ch === "instagram"
                  ? !!lead.instagram
                  : ch === "facebook"
                  ? !!lead.facebook
                  : !!lead.twitter;

              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannel(ch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="capitalize">{ch}</span>
                  {hasContact && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* ========================================================= */}
        {/* EMAIL OUTREACH COMPOSER SECTION                           */}
        {/* ========================================================= */}
        {selectedChannel === "email" ? (
          <div className="space-y-4">
            {/* Top Row: Client Gmail & Sender Gmail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Client Gmail Card with dedicated Copy button */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    Client Gmail
                  </span>
                  <p className="text-xs font-semibold text-slate-900 truncate select-all">
                    {lead.email || "No email on file"}
                  </p>
                </div>
                {lead.email && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySeparate(lead.email || "", "clientEmail", "Client Gmail")}
                    className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-colors ${
                      copiedField === "clientEmail"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : ""
                    }`}
                    leftIcon={
                      copiedField === "clientEmail" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedField === "clientEmail" ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>

              {/* 2. Sender Gmail Card / Select field */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1">
                    <span>Sender Gmail</span>
                    {isFollowUp && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </span>

                  {isFollowUp ? (
                    <p className="text-xs font-semibold text-slate-900 truncate select-all">
                      {lead.originalSenderEmail || selectedSenderGmail || "Default Sender"}
                    </p>
                  ) : (
                    <select
                      value={selectedSenderGmail}
                      onChange={(e) => setSelectedSenderGmail(e.target.value)}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-0.5"
                    >
                      {senderGmails.length > 0 ? (
                        senderGmails.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))
                      ) : (
                        <option value={userProfile.email || "default"}>
                          {userProfile.email || "Add Gmail in Settings"}
                        </option>
                      )}
                    </select>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopySeparate(
                      (isFollowUp ? lead.originalSenderEmail : selectedSenderGmail) ||
                        userProfile.email,
                      "senderEmail",
                      "Sender Gmail"
                    )
                  }
                  className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-colors ${
                    copiedField === "senderEmail"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : ""
                  }`}
                  leftIcon={
                    copiedField === "senderEmail" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedField === "senderEmail" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Requirement 6 & 9: Display Original Outreach Template & Specific Template */}
            {isFollowUp && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Outreach Template:{" "}
                      <strong className="text-amber-950 font-extrabold">
                        {activeFollowUp?.templateCategory || lead.originalOutreachType || activeCategory}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                    {followUpNumber === 1 ? "1st Follow-up" : "2nd Follow-up (Final)"}
                  </span>
                </div>
                {(activeFollowUp?.templateName || lead.originalOutreachType) && (
                  <p className="text-[11px] text-amber-800 font-medium pl-6">
                    Template: <strong>{activeFollowUp?.templateName || lead.originalOutreachType}</strong>
                  </p>
                )}
                {activeFollowUp?.subject && selectedChannel === "email" && (
                  <p className="text-[11px] text-amber-800 font-medium pl-6">
                    Email Subject: <strong>{activeFollowUp.subject}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Category & Template Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {!isFollowUp ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Outreach Category
                  </label>
                  <Select
                    value={activeCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="py-1.5 text-xs font-semibold bg-white border-slate-300"
                  >
                    {OUTREACH_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-amber-600" />
                    <span>Follow-up Cadence</span>
                  </label>
                  <div className="px-3 py-1.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
                    Follow-up Outreach Templates
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Template</span>
                </label>
                <Select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="py-1.5 text-xs font-semibold bg-indigo-50/50 border-indigo-200"
                >
                  <option value="">-- Choose a template --</option>
                  {availableTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Subject Line with Dedicated Copy Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Subject Line
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySeparate(subject, "subject", "Subject Line")}
                  className={`h-6 px-2 text-[11px] font-semibold transition-colors ${
                    copiedField === "subject"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                  leftIcon={
                    copiedField === "subject" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )
                  }
                >
                  {copiedField === "subject" ? "Subject Copied" : "Copy Subject"}
                </Button>
              </div>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Quick question regarding your web presence"
              />
            </div>

            {/* Message Textarea with Dedicated Copy Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Outreach Message
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySeparate(message, "message", "Message Content")}
                  className={`h-6 px-2 text-[11px] font-semibold transition-colors ${
                    copiedField === "message"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-600 hover:text-indigo-600"
                  }`}
                  leftIcon={
                    copiedField === "message" ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )
                  }
                >
                  {copiedField === "message" ? "Message Copied" : "Copy Message"}
                </Button>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Write or customize your email outreach message..."
                className="font-mono text-xs leading-relaxed"
                helperText="Client Gmail, Subject, and Message each have dedicated separate Copy buttons above."
              />
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* OTHER CHANNELS (WhatsApp, LinkedIn, Instagram, Facebook) */
          /* ========================================================= */
          <div className="space-y-4">
            {/* Recipient Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  {currentChannelConfig.recipientLabel}
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate select-all">
                  {currentChannelConfig.recipientValue}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                  {lead.websiteStatus}
                </span>
              </div>
            </div>

            {/* Template Selector for social channels */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Use Pre-Built Template</span>
              </label>
              <div className="w-full sm:w-64">
                <Select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="py-1.5 text-xs bg-indigo-50/40 border-indigo-200"
                >
                  <option value="">-- Choose a template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Message Textarea */}
            <Textarea
              label="Outreach Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Write or customize your outreach message here..."
              className="font-mono text-xs leading-relaxed"
              helperText="Variables like {business_name}, {ceo_name}, and {niche} have been pre-filled."
            />
          </div>
        )}

        {/* Follow-up Reminder Schedule (Requirement 2) */}
        {!isFollowUp ? (
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/90 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Schedule follow-up reminder if no reply:</span>
              </div>
              <select
                value={scheduleFollowUpDays}
                onChange={(e) => setScheduleFollowUpDays(e.target.value)}
                className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs text-amber-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="2">In 2 days</option>
                <option value="3">In 3 days (Recommended)</option>
                <option value="5">In 5 days</option>
                <option value="7">In 1 week</option>
                <option value="none">Do not schedule</option>
              </select>
            </div>

            {reminderForecast && (
              <div className="pt-1.5 border-t border-amber-200/60 text-[11px] text-amber-950 font-medium space-y-0.5">
                <p>
                  👉 <strong>You need to send the 1st follow-up on {reminderForecast.firstDate}.</strong>
                </p>
                <p className="text-amber-800">
                  If the 1st follow-up is sent, the 2nd follow-up will be due on{" "}
                  <strong>{reminderForecast.secondDate}</strong>.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* When in Follow-up mode, show cadence info */
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/90 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Repeat className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Sending <strong>{followUpNumber === 1 ? "1st Follow-up" : "2nd Follow-up"}</strong>
                {followUpNumber === 2 ? " (Final follow-up in cadence)" : " (Next follow-up calculated from actual send date)"}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {followUpNumber === 1 ? "Step 1 of 2" : "Step 2 of 2 (Completes)"}
            </span>
          </div>
        )}

        {/* Channel Guidance Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {selectedChannel === "email" ? (
              <>
                Clicking <strong>Copy &amp; Save</strong> will copy your message and save this outreach activity (including your selected sender Gmail and outreach category) to the database without navigating to any external mail application.
              </>
            ) : (
              <>
                Your message will be <strong>saved as prepared in this lead&apos;s activity timeline</strong> and{" "}
                <strong>copied to your clipboard</strong> before opening your{" "}
                <span className="font-semibold text-slate-800 capitalize">
                  {selectedChannel}
                </span>{" "}
                chat window.
              </>
            )}
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="ghost" onClick={closeOutreach} disabled={isSubmitting}>
            Cancel
          </Button>

          {selectedChannel === "email" ? (
            <Button
              variant="primary"
              onClick={handleCopyAndSaveEmail}
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-500 font-bold px-5"
            >
              Copy &amp; Save
            </Button>
          ) : (
            <Button
              variant={currentChannelConfig.buttonVariant}
              onClick={handleCopyAndOpenOtherChannel}
              isLoading={isSubmitting}
              leftIcon={<Copy className="w-4 h-4" />}
              rightIcon={<ExternalLink className="w-3.5 h-3.5 opacity-80" />}
            >
              {currentChannelConfig.buttonLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
