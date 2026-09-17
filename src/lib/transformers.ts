import {
  Lead,
  FollowUpItem,
  MessageTemplate,
  ActivityItem,
  WebsiteStatus,
  LeadStatus,
  Channel,
  LeadFinderBusinessItem,
  EmailVerificationResult,
  PhoneVerificationResult,
} from "./types";
import { ILead, DbWebsiteStatus, DbLeadStatus } from "./models/Lead";
import { IFollowUp } from "./models/FollowUp";
import { IOutreachActivity } from "./models/OutreachActivity";
import { IMessageTemplate } from "./models/MessageTemplate";

export function mapEmailVerification(ev?: any): EmailVerificationResult | undefined {
  if (!ev || !ev.status) return undefined;
  return {
    status: ev.status,
    syntaxValid: Boolean(ev.syntaxValid),
    domainExists: ev.domainExists ?? null,
    mxRecord: ev.mxRecord ?? null,
    mailServer: ev.mailServer ?? null,
    spf: ev.spf ?? null,
    dmarc: ev.dmarc ?? null,
    disposable: Boolean(ev.disposable),
    freeProvider: Boolean(ev.freeProvider),
    roleBased: Boolean(ev.roleBased),
    smtpStatus: ev.smtpStatus || "unknown",
    catchAll: ev.catchAll ?? "unknown",
    emailType: ev.emailType || "Business Email",
    mxRecords: Array.isArray(ev.mxRecords) ? ev.mxRecords : [],
    checkedAt: ev.checkedAt ? new Date(ev.checkedAt).toISOString() : new Date().toISOString(),
    verificationMethod: ev.verificationMethod || "free_local",
    details: ev.details || undefined,
  };
}

export function mapPhoneVerification(pv?: any): PhoneVerificationResult | undefined {
  if (!pv || !pv.status) return undefined;
  return {
    status: pv.status,
    valid: Boolean(pv.valid),
    possible: Boolean(pv.possible),
    country: pv.country || "Unknown",
    countryCode: pv.countryCode || "",
    regionCode: pv.regionCode || "",
    numberType: pv.numberType || "Unknown",
    internationalFormat: pv.internationalFormat || "",
    nationalFormat: pv.nationalFormat || "",
    e164Format: pv.e164Format || "",
    whatsappStatus: pv.whatsappStatus || "unknown",
    checkedAt: pv.checkedAt ? new Date(pv.checkedAt).toISOString() : new Date().toISOString(),
    verificationMethod: pv.verificationMethod || "free_local",
    details: pv.details || undefined,
  };
}

// Map frontend WebsiteStatus to DB enum
export function toDbWebsiteStatus(status?: string): DbWebsiteStatus {
  if (!status) return "NO_WEBSITE";
  switch (status.toLowerCase()) {
    case "no website":
    case "no_website":
      return "NO_WEBSITE";
    case "redesign":
      return "REDESIGN";
    case "seo performance":
    case "seo_performance":
    case "seo":
      return "SEO_PERFORMANCE";
    default:
      return "OTHER";
  }
}

// Map DB enum to frontend WebsiteStatus
export function fromDbWebsiteStatus(status?: string): WebsiteStatus {
  if (!status) return "No Website";
  switch (status) {
    case "NO_WEBSITE":
      return "No Website";
    case "REDESIGN":
      return "Redesign";
    case "SEO_PERFORMANCE":
      return "SEO Performance";
    default:
      return "Other";
  }
}

// Map frontend LeadStatus to DB enum
export function toDbLeadStatus(status?: string): DbLeadStatus {
  if (!status) return "NEW";
  switch (status.toLowerCase()) {
    case "new":
      return "NEW";
    case "qualified":
      return "QUALIFIED";
    case "contacted":
      return "CONTACTED";
    case "connected":
      return "CONNECTED";
    case "replied":
      return "REPLIED";
    case "interested":
      return "INTERESTED";
    case "follow-up":
    case "follow_up":
    case "followup":
      return "FOLLOW_UP";
    case "meeting":
      return "MEETING";
    case "proposal":
      return "PROPOSAL";
    case "won":
      return "WON";
    case "lost":
      return "LOST";
    default:
      return "NEW";
  }
}

// Map DB enum to frontend LeadStatus
export function fromDbLeadStatus(status?: string): LeadStatus {
  if (!status) return "New";
  switch (status) {
    case "NEW":
      return "New";
    case "QUALIFIED":
      return "Qualified";
    case "CONTACTED":
      return "Contacted";
    case "CONNECTED":
      return "Connected";
    case "REPLIED":
      return "Replied";
    case "INTERESTED":
      return "Interested";
    case "FOLLOW_UP":
      return "Follow-up";
    case "MEETING":
      return "Meeting";
    case "PROPOSAL":
      return "Proposal";
    case "WON":
      return "Won";
    case "LOST":
      return "Lost";
    default:
      return "New";
  }
}

// Transform Lead DB Document to frontend Lead interface
export function transformLead(
  doc: ILead | any,
  activities: (IOutreachActivity | any)[] = []
): Lead {
  const dateAddedStr = doc.createdAt
    ? new Date(doc.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const lastContactStr = doc.lastContactAt
    ? new Date(doc.lastContactAt).toISOString().split("T")[0]
    : undefined;

  const foundAtStr = doc.foundAt
    ? new Date(doc.foundAt).toISOString()
    : doc.createdAt
    ? new Date(doc.createdAt).toISOString()
    : undefined;

  // Extract googleMapsUrl and ensure notes is clean of scraper URL
  let extractedMapsUrl =
    doc.googleMapsUrl ||
    (doc.finderBusinessId as any)?.googleMapsUrl ||
    undefined;

  let cleanNotes = doc.notes || undefined;
  if (cleanNotes && cleanNotes.includes("Imported via Google Maps Lead Scraper")) {
    const match = cleanNotes.match(/\((https?:\/\/[^\s\)]+)\)/);
    if (match && match[1] && !extractedMapsUrl) {
      extractedMapsUrl = match[1];
    }
    cleanNotes = cleanNotes
      .replace(/Imported via Google Maps Lead Scraper\s*\([^\)]*\)/gi, "")
      .trim();
    if (!cleanNotes) cleanNotes = undefined;
  }

  const lastAuditedStr = doc.lastAuditedAt
    ? new Date(doc.lastAuditedAt).toISOString()
    : undefined;

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    businessName: doc.businessName,
    ceoName: doc.ceoName || undefined,
    niche: doc.industry || "Restaurants",
    location: doc.location,
    website: doc.website || undefined,
    websiteStatus: fromDbWebsiteStatus(doc.websiteStatus),
    leadScore: doc.leadScore || 75,
    email: doc.email || (doc.finderBusinessId as any)?.email || undefined,
    whatsapp:
      doc.whatsapp ||
      (doc.finderBusinessId as any)?.whatsapp ||
      doc.phone ||
      (doc.finderBusinessId as any)?.phone ||
      undefined,
    phone:
      doc.phone ||
      (doc.finderBusinessId as any)?.phone ||
      doc.whatsapp ||
      (doc.finderBusinessId as any)?.whatsapp ||
      undefined,
    linkedin: doc.linkedin || (doc.finderBusinessId as any)?.linkedin || undefined,
    instagram: doc.instagram || (doc.finderBusinessId as any)?.instagram || undefined,
    facebook: doc.facebook || (doc.finderBusinessId as any)?.facebook || undefined,
    twitter: doc.twitter || (doc.finderBusinessId as any)?.twitter || undefined,
    status: fromDbLeadStatus(doc.leadStatus),
    lastContact: lastContactStr,
    dateAdded: dateAddedStr,
    foundAt: foundAtStr,
    finderBusinessId: doc.finderBusinessId ? doc.finderBusinessId.toString() : undefined,
    googleMapsUrl: extractedMapsUrl,
    link: doc.link || undefined,
    auditStatus: doc.auditStatus || "NOT_AUDITED",
    auditScore: doc.auditScore ?? undefined,
    lastAuditedAt: lastAuditedStr,
    notes: cleanNotes,
    avatarColor: doc.avatarColor || "bg-indigo-600",
    originalSenderEmail: doc.originalSenderEmail || undefined,
    originalOutreachType: doc.originalOutreachType || undefined,
    activities: activities.map((a) => transformActivity(a)),
    emailVerification: mapEmailVerification(doc.emailVerification || (doc.finderBusinessId as any)?.emailVerification),
    phoneVerification: mapPhoneVerification(doc.phoneVerification || (doc.finderBusinessId as any)?.phoneVerification),
  };
}

// Transform LeadFinderBusiness DB Document to frontend LeadFinderBusinessItem
export function transformLeadFinderBusiness(
  doc: any,
  connectedLeadStatus?: string | null
): LeadFinderBusinessItem {
  const isLeadConnected =
    connectedLeadStatus === "CONNECTED" ||
    connectedLeadStatus === "CONTACTED" ||
    connectedLeadStatus === "REPLIED" ||
    connectedLeadStatus === "INTERESTED" ||
    connectedLeadStatus === "FOLLOW_UP" ||
    connectedLeadStatus === "MEETING" ||
    connectedLeadStatus === "PROPOSAL" ||
    connectedLeadStatus === "WON";

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    businessName: doc.businessName,
    rating: doc.rating ?? null,
    totalReviews: doc.totalReviews ?? null,
    openClosed: doc.openClosed ?? null,
    openingHours: doc.openingHours ?? null,
    businessCategory: doc.businessCategory ?? null,
    phone: doc.phone ?? (doc.leadId as any)?.phone ?? null,
    email: doc.email ?? (doc.leadId as any)?.email ?? null,
    whatsapp:
      doc.whatsapp ??
      (doc.leadId as any)?.whatsapp ??
      doc.phone ??
      (doc.leadId as any)?.phone ??
      null,
    facebook: doc.facebook ?? (doc.leadId as any)?.facebook ?? null,
    instagram: doc.instagram ?? (doc.leadId as any)?.instagram ?? null,
    linkedin: doc.linkedin ?? (doc.leadId as any)?.linkedin ?? null,
    twitter: doc.twitter ?? (doc.leadId as any)?.twitter ?? null,
    website: doc.website ?? null,
    fullAddress: doc.fullAddress ?? null,
    location: doc.location ?? null,
    googleMapsUrl: doc.googleMapsUrl ?? null,
    foundAt: doc.foundAt ? new Date(doc.foundAt).toISOString() : new Date().toISOString(),
    isSelected: Boolean(doc.isConfirmed ?? doc.isSelected),
    leadId: doc.leadId ? doc.leadId.toString() : null,
    isConnected: Boolean(isLeadConnected),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    emailVerification: mapEmailVerification(doc.emailVerification || (doc.leadId as any)?.emailVerification),
    phoneVerification: mapPhoneVerification(doc.phoneVerification || (doc.leadId as any)?.phoneVerification),
  };
}

// Helper to format date in clean English: "September 20, 2026"
export function formatEnglishDate(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

// Transform OutreachActivity DB document to frontend ActivityItem
export function transformActivity(doc: IOutreachActivity | any): ActivityItem {
  const dateStr = doc.createdAt
    ? new Date(doc.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const timeStr = doc.createdAt
    ? new Date(doc.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  let channelMapped: Channel | "system" | "call" | "note" = "system";
  const chLower = (doc.channel || "").toLowerCase();
  if (
    chLower === "email" ||
    chLower === "whatsapp" ||
    chLower === "linkedin" ||
    chLower === "instagram" ||
    chLower === "facebook" ||
    chLower === "twitter"
  ) {
    channelMapped = chLower as Channel;
  } else if (chLower === "call") {
    channelMapped = "call";
  } else if (chLower === "note") {
    channelMapped = "note";
  }

  let statusMapped: "Sent" | "Delivered" | "Replied" | "Prepared" | "Scheduled" | "Completed" = "Prepared";
  const stUpper = (doc.status || "").toUpperCase();
  if (stUpper === "SENT") statusMapped = "Sent";
  else if (stUpper === "REPLIED") statusMapped = "Replied";
  else if (stUpper === "COMPLETED") statusMapped = "Completed";
  else if (stUpper === "DELIVERED") statusMapped = "Delivered";
  else statusMapped = "Prepared";

  const channelTitle =
    channelMapped.charAt(0).toUpperCase() + channelMapped.slice(1);
  
  let typeText = doc.notes || `${channelTitle} activity`;
  if (doc.followUpNumber) {
    typeText = `${channelTitle} ${doc.followUpNumber === 1 ? "1st" : "2nd"} follow-up ${statusMapped === "Sent" ? "sent" : "prepared"}`;
  } else if (statusMapped === "Sent") {
    typeText = `${channelTitle} outreach sent`;
  } else if (statusMapped === "Prepared") {
    typeText = `${channelTitle} message prepared`;
  }

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    channel: channelMapped,
    type: typeText,
    date: dateStr,
    time: timeStr,
    messagePreview: doc.message
      ? doc.message.substring(0, 100) + (doc.message.length > 100 ? "..." : "")
      : undefined,
    fullMessage: doc.message || undefined,
    status: statusMapped,
    senderEmail: doc.senderEmail || undefined,
    outreachType: doc.outreachType || undefined,
    templateCategory: doc.templateCategory || doc.outreachType || undefined,
    templateName: doc.templateName || undefined,
    recipient: doc.recipient || undefined,
    subject: doc.subject || undefined,
    followUpNumber: doc.followUpNumber || undefined,
    intervalDays: doc.intervalDays || undefined,
  };
}

// Transform FollowUp DB document to frontend FollowUpItem
export function transformFollowUp(
  doc: IFollowUp | any,
  lead?: ILead | any
): FollowUpItem {
  const schedDate = doc.scheduledAt ? new Date(doc.scheduledAt) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedDay = new Date(schedDate);
  schedDay.setHours(0, 0, 0, 0);

  const dueDateStr = schedDate.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const currentStep = doc.currentStep ?? 1;

  let calculatedStatus: "today" | "upcoming" | "overdue" | "completed" = "upcoming";
  if (doc.status === "COMPLETED" || doc.completedAt || currentStep > 2) {
    calculatedStatus = "completed";
  } else if (dueDateStr === todayStr) {
    calculatedStatus = "today";
  } else if (schedDay.getTime() < today.getTime()) {
    calculatedStatus = "overdue";
  } else {
    calculatedStatus = "upcoming";
  }

  const priorityLower = (doc.priority || "medium").toLowerCase() as
    | "high"
    | "medium"
    | "low";

  const leadName = lead ? lead.businessName : doc.leadId?.businessName || "Unknown Lead";
  const contactName = lead ? lead.ceoName || lead.businessName : doc.leadId?.ceoName || leadName;

  // History mapping
  const mappedHistory = Array.isArray(doc.history)
    ? doc.history.map((h: any) => ({
        id: h._id ? h._id.toString() : undefined,
        followUpNumber: h.followUpNumber || 1,
        scheduledDate: h.scheduledDate,
        sentAt: h.sentAt ? new Date(h.sentAt).toISOString() : undefined,
        sentDate: h.sentDate,
        channel: ((h.channel || doc.channel || "email").toLowerCase() as Channel) || "email",
        templateCategory: h.templateCategory,
        templateName: h.templateName,
        subject: h.subject,
        messagePreview: h.messagePreview,
        notes: h.notes,
      }))
    : [];

  // Generate dynamic reschedule notice if needed
  let rescheduleNotice = doc.rescheduleNotice;
  if (!rescheduleNotice && doc.isRescheduled && currentStep === 2 && schedDate) {
    rescheduleNotice = `Rescheduled: You need to send the 2nd follow-up on ${formatEnglishDate(schedDate)}.`;
  }

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    leadId: doc.leadId?._id ? doc.leadId._id.toString() : doc.leadId ? doc.leadId.toString() : "",
    businessName: leadName,
    contactPerson: contactName,
    channel: ((doc.channel || "email").toLowerCase() as Channel) || "email",
    originalMessagePreview: doc.originalMessagePreview || doc.message || doc.notes || "Follow-up scheduled",
    dueDate: dueDateStr,
    dueTime: doc.dueTime || "10:00 AM",
    status: calculatedStatus,
    priority: priorityLower,
    notes: doc.notes || doc.message || undefined,
    completedAt: doc.completedAt
      ? new Date(doc.completedAt).toISOString().split("T")[0]
      : undefined,
    intervalDays: doc.intervalDays ?? 3,
    currentStep: currentStep,
    originalMessageDate: doc.originalMessageDate
      ? new Date(doc.originalMessageDate).toISOString().split("T")[0]
      : undefined,
    templateCategory: doc.templateCategory || undefined,
    templateName: doc.templateName || undefined,
    subject: doc.subject || undefined,
    firstFollowUpScheduledAt: doc.firstFollowUpScheduledAt
      ? new Date(doc.firstFollowUpScheduledAt).toISOString().split("T")[0]
      : undefined,
    firstFollowUpSentAt: doc.firstFollowUpSentAt
      ? new Date(doc.firstFollowUpSentAt).toISOString()
      : undefined,
    secondFollowUpScheduledAt: doc.secondFollowUpScheduledAt
      ? new Date(doc.secondFollowUpScheduledAt).toISOString().split("T")[0]
      : undefined,
    secondFollowUpSentAt: doc.secondFollowUpSentAt
      ? new Date(doc.secondFollowUpSentAt).toISOString()
      : undefined,
    isRescheduled: Boolean(doc.isRescheduled),
    rescheduleNotice: rescheduleNotice || undefined,
    history: mappedHistory,
  };
}

export function normalizeCategory(cat?: string): string {
  if (!cat) return "General Introduction";
  const c = cat.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  if (c.includes("no website") || c.includes("web development")) return "No Website";
  if (c.includes("redesign") || c.includes("web design")) return "Website Redesign";
  if (c.includes("seo")) return "SEO Improvement";
  if (c.includes("booking")) return "Booking System";
  if (c.includes("custom")) return "Custom Website";
  if (c.includes("mobile") || c.includes("app")) return "Mobile App";
  if (c.includes("follow")) return "Follow-up";
  if (c.includes("general") || c.includes("intro")) return "General Introduction";
  return cat;
}

// Transform MessageTemplate DB document to frontend MessageTemplate
export function transformTemplate(doc: IMessageTemplate | any): MessageTemplate {
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    name: doc.name,
    category: normalizeCategory(doc.category),
    subject: doc.subject || undefined,
    body: doc.message || doc.body || "",
    channels: ((doc.channels || ["email", "whatsapp", "linkedin"]) as string[]).map(
      (c) => c.toLowerCase() as Channel
    ),
  };
}
