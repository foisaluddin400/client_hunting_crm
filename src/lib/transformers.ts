import {
  Lead,
  FollowUpItem,
  MessageTemplate,
  ActivityItem,
  WebsiteStatus,
  LeadStatus,
  Channel,
  LeadFinderBusinessItem,
} from "./types";
import { ILead, DbWebsiteStatus, DbLeadStatus } from "./models/Lead";
import { IFollowUp } from "./models/FollowUp";
import { IOutreachActivity } from "./models/OutreachActivity";
import { IMessageTemplate } from "./models/MessageTemplate";

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

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    businessName: doc.businessName,
    ceoName: doc.ceoName || undefined,
    niche: doc.industry || "Restaurants",
    location: doc.location,
    website: doc.website || undefined,
    websiteStatus: fromDbWebsiteStatus(doc.websiteStatus),
    leadScore: doc.leadScore || 75,
    email: doc.email || undefined,
    whatsapp: doc.whatsapp || undefined,
    phone: doc.phone || undefined,
    linkedin: doc.linkedin || undefined,
    instagram: doc.instagram || undefined,
    facebook: doc.facebook || undefined,
    twitter: doc.twitter || undefined,
    status: fromDbLeadStatus(doc.leadStatus),
    lastContact: lastContactStr,
    dateAdded: dateAddedStr,
    foundAt: foundAtStr,
    finderBusinessId: doc.finderBusinessId ? doc.finderBusinessId.toString() : undefined,
    notes: doc.notes || undefined,
    avatarColor: doc.avatarColor || "bg-indigo-600",
    activities: activities.map((a) => transformActivity(a)),
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
    phone: doc.phone ?? null,
    email: doc.email ?? null,
    website: doc.website ?? null,
    fullAddress: doc.fullAddress ?? null,
    googleMapsUrl: doc.googleMapsUrl ?? null,
    foundAt: doc.foundAt ? new Date(doc.foundAt).toISOString() : new Date().toISOString(),
    isSelected: Boolean(doc.isConfirmed ?? doc.isSelected),
    leadId: doc.leadId ? doc.leadId.toString() : null,
    isConnected: Boolean(isLeadConnected),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
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
  const typeText =
    statusMapped === "Sent"
      ? `${channelTitle} outreach sent`
      : statusMapped === "Prepared"
      ? `${channelTitle} message prepared`
      : doc.notes || `${channelTitle} activity`;

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

  let calculatedStatus: "today" | "upcoming" | "overdue" | "completed" = "upcoming";
  if (doc.status === "COMPLETED" || doc.completedAt) {
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

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    leadId: doc.leadId?._id ? doc.leadId._id.toString() : doc.leadId ? doc.leadId.toString() : "",
    businessName: leadName,
    contactPerson: contactName,
    channel: ((doc.channel || "email").toLowerCase() as Channel) || "email",
    originalMessagePreview: doc.message || doc.notes || "Follow-up scheduled",
    dueDate: dueDateStr,
    dueTime: doc.dueTime || "10:00 AM",
    status: calculatedStatus,
    priority: priorityLower,
    notes: doc.notes || doc.message || undefined,
    completedAt: doc.completedAt
      ? new Date(doc.completedAt).toISOString().split("T")[0]
      : undefined,
  };
}

// Transform MessageTemplate DB document to frontend MessageTemplate
export function transformTemplate(doc: IMessageTemplate | any): MessageTemplate {
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    name: doc.name,
    category: doc.category || "GENERAL",
    subject: doc.subject || undefined,
    body: doc.message,
    channels: ((doc.channels || ["email", "whatsapp", "linkedin"]) as string[]).map(
      (c) => c.toLowerCase() as Channel
    ),
  };
}
