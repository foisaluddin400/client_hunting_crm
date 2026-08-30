"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { useToast } from "@/lib/context/toast-context";
import { Channel } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { copyToClipboard, replaceTemplateVariables } from "@/lib/utils";
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
  ExternalLink,
  Sparkles,
  Send,
  Calendar,
  Info,
} from "lucide-react";

export function OutreachModal() {
  const {
    activeOutreach,
    closeOutreach,
    templates,
    logActivity,
    updateLead,
    addFollowUp,
    sendEmailSmtp,
    userProfile,
    smtpConfig,
  } = useCRM();
  const { showToast } = useToast();

  const { isOpen, lead, channel = "email", defaultMessage = "" } = activeOutreach;

  const [selectedChannel, setSelectedChannel] = useState<Channel>(channel);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [scheduleFollowUpDays, setScheduleFollowUpDays] = useState<string>("3");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when active outreach opens
  useEffect(() => {
    if (isOpen && lead) {
      const initChannel = channel || (lead.email ? "email" : "whatsapp");
      setSelectedChannel(initChannel);

      // Pick best matching template based on lead's website status
      let defaultTplId = "";
      if (lead.websiteStatus === "No Website") {
        defaultTplId = "tpl-no-website";
      } else if (lead.websiteStatus === "Redesign") {
        defaultTplId = "tpl-redesign";
      } else if (lead.websiteStatus === "SEO Performance") {
        defaultTplId = "tpl-seo";
      } else {
        defaultTplId = "tpl-general-intro";
      }

      const tpl = templates.find((t) => t.id === defaultTplId) || templates[0];
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
    setIsCopied(false);
  }, [isOpen, lead, channel, defaultMessage, templates, userProfile]);

  if (!isOpen || !lead) return null;

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
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
    }
  };

  // Schedule follow-up helper
  const maybeScheduleFollowUp = async () => {
    if (scheduleFollowUpDays !== "none") {
      const days = parseInt(scheduleFollowUpDays, 10);
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + days);
      const dueDateStr = followUpDate.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];

      await addFollowUp({
        leadId: lead.id,
        businessName: lead.businessName,
        contactPerson: lead.ceoName || lead.businessName,
        channel: selectedChannel,
        originalMessagePreview: message.substring(0, 80) + "...",
        dueDate: dueDateStr,
        dueTime: "10:00 AM",
        status: "upcoming",
        priority: "medium",
        notes: `Follow up after ${selectedChannel} outreach on ${todayStr}`,
      });
    }
  };

  // Channel configuration
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
      title: "Email Outreach",
      icon: <Mail className="w-5 h-5 text-indigo-600" />,
      recipientLabel: "To (Client Email):",
      recipientValue: lead.email || "No email on file",
      buttonLabel: "Copy & Open Email App",
      buttonVariant: "email",
      actionUrl: `mailto:${lead.email || ""}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(message)}`,
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

  // Action 1: Send directly via Server-Side SMTP
  const handleSendSmtp = async () => {
    if (!lead.email) {
      showToast({
        type: "error",
        title: "No Email Address",
        message: "This lead does not have a recipient email address on file.",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await sendEmailSmtp({
      leadId: lead.id,
      recipient: lead.email,
      subject: subject || "Quick question regarding your web presence",
      message,
    });

    if (success) {
      await maybeScheduleFollowUp();
      closeOutreach();
    }
    setIsSubmitting(false);
  };

  // Action 2: Copy message & Open external channel client/URL
  const handleCopyAndOpen = async () => {
    setIsSubmitting(true);

    const fullTextToCopy =
      selectedChannel === "email" && subject
        ? `Subject: ${subject}\n\n${message}`
        : message;

    const copySuccess = await copyToClipboard(fullTextToCopy);
    setIsCopied(copySuccess);

    const todayStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Record activity as PREPARED
    await logActivity(lead.id, {
      channel: selectedChannel,
      type: `${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)} outreach prepared`,
      date: todayStr,
      time: timeStr,
      messagePreview: message.substring(0, 120) + (message.length > 120 ? "..." : ""),
      fullMessage: message,
      status: "Prepared",
    });

    // Schedule follow-up
    await maybeScheduleFollowUp();

    // Show honest toast
    showToast({
      type: "success",
      title: "Message Copied & Activity Saved! 🚀",
      message: "Message copied and activity saved. Complete sending on the platform.",
      duration: 5000,
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
          <span>Outreach Composer — {lead.businessName}</span>
        </div>
      }
      description={`Target contact: ${lead.ceoName || lead.businessName} • ${lead.location}`}
    >
      <div className="space-y-4">
        {/* Channel Selector Switcher */}
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

        {/* Template Selector */}
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
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Email Subject Line (Only if email) */}
        {selectedChannel === "email" && (
          <Input
            label="Subject Line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick question regarding your web presence"
          />
        )}

        {/* Message Textarea */}
        <Textarea
          label="Outreach Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder="Write or customize your outreach message here..."
          className="font-mono text-xs leading-relaxed"
          helperText="Variables like {business_name}, {ceo_name}, and {niche} have been pre-filled."
        />

        {/* Follow-up Reminder Schedule */}
        <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs">
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

        {/* Channel Guidance Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {selectedChannel === "email" ? (
              <>
                You can send directly via your configured{" "}
                <strong>outbound SMTP server</strong> or copy the message to your local mail client.
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

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="ghost" onClick={closeOutreach} disabled={isSubmitting}>
            Cancel
          </Button>

          {selectedChannel === "email" ? (
            <>
              <Button
                variant="outline"
                onClick={handleCopyAndOpen}
                isLoading={isSubmitting}
                leftIcon={<Copy className="w-4 h-4" />}
                rightIcon={<ExternalLink className="w-3.5 h-3.5 opacity-80" />}
              >
                Copy & Open Mail App
              </Button>
              <Button
                variant="primary"
                onClick={handleSendSmtp}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold"
              >
                Send via SMTP
              </Button>
            </>
          ) : (
            <Button
              variant={currentChannelConfig.buttonVariant}
              onClick={handleCopyAndOpen}
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
