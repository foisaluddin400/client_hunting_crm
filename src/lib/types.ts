export type WebsiteStatus = 'No Website' | 'Redesign' | 'SEO Performance' | 'Other';

export type LeadStatus =
  | 'New'
  | 'Qualified'
  | 'Contacted'
  | 'Connected'
  | 'Replied'
  | 'Interested'
  | 'Follow-up'
  | 'Meeting'
  | 'Proposal'
  | 'Won'
  | 'Lost';

export type Channel =
  | 'email'
  | 'whatsapp'
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'twitter';

export type FollowUpStatus = 'today' | 'upcoming' | 'overdue' | 'completed';

export type Priority = 'high' | 'medium' | 'low';

export interface ActivityItem {
  id: string;
  channel: Channel | 'system' | 'call' | 'note';
  type: string; // e.g. "Email sent", "WhatsApp contacted", "LinkedIn message prepared", "Follow-up completed", "Lead status changed"
  date: string;
  time?: string;
  messagePreview?: string;
  fullMessage?: string;
  status: 'Sent' | 'Delivered' | 'Replied' | 'Prepared' | 'Scheduled' | 'Completed';
  author?: string;
  senderEmail?: string;
  outreachType?: string;
  templateCategory?: string;
  templateName?: string;
  recipient?: string;
  subject?: string;
  followUpNumber?: number;
  intervalDays?: number;
}

export type VerificationStatus =
  | 'not_checked'
  | 'valid'
  | 'invalid'
  | 'risky'
  | 'unknown';

export interface EmailVerificationResult {
  status: VerificationStatus;
  syntaxValid: boolean;
  domainExists: boolean | null;
  mxRecord: boolean | null;
  mailServer: boolean | null;
  spf: boolean | null;
  dmarc: boolean | null;
  disposable: boolean;
  freeProvider: boolean;
  roleBased: boolean;
  smtpStatus: 'available' | 'inconclusive' | 'rejected' | 'unknown';
  catchAll: boolean | 'unknown';
  emailType: 'Business Email' | 'Personal Email' | 'Disposable Email' | 'Invalid';
  mxRecords?: string[];
  checkedAt: string;
  verificationMethod: 'free_local';
  details?: string;
}

export interface PhoneVerificationResult {
  status: VerificationStatus;
  valid: boolean;
  possible: boolean;
  country: string;
  countryCode: string;
  regionCode: string;
  numberType: string;
  internationalFormat: string;
  nationalFormat: string;
  e164Format: string;
  whatsappStatus: 'yes' | 'no' | 'unknown';
  checkedAt: string;
  verificationMethod: 'free_local';
  details?: string;
}

export interface Lead {
  id: string;
  businessName: string;
  ceoName?: string;
  niche: string;
  location: string;
  website?: string;
  websiteStatus: WebsiteStatus;
  leadScore: number; // 0 - 100
  email?: string;
  whatsapp?: string;
  phone?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  status: LeadStatus;
  lastContact?: string;
  dateAdded: string;
  foundAt?: string;
  finderBusinessId?: string;
  googleMapsUrl?: string;
  link?: string;
  auditStatus?: "NOT_AUDITED" | "AUDITING" | "COMPLETED" | "FAILED";
  auditScore?: number;
  lastAuditedAt?: string;
  notes?: string;
  activities: ActivityItem[];
  avatarColor?: string;
  originalSenderEmail?: string;
  originalOutreachType?: string;
  emailVerification?: EmailVerificationResult;
  phoneVerification?: PhoneVerificationResult;
}

export type AuditCheckStatus = "Passed" | "Needs improvement" | "Failed" | "N/A";

export interface AuditCheckItem {
  id: string;
  label: string;
  status: AuditCheckStatus;
  value?: string;
  message: string;
  whyItMatters: string;
}

export interface AuditProblemItem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface WebsiteAuditItem {
  id?: string;
  leadId: string;
  url: string;
  status: "AUDITING" | "COMPLETED" | "FAILED";
  overallScore: number;
  scores: {
    pageSpeed: number;
    lighthouse: number;
    mobile: number;
    uxTechnicalDesign: number;
  };
  checks: AuditCheckItem[];
  problems: AuditProblemItem[];
  recommendedImprovements: string[];
  recommendedFeatures: string[];
  businessRecommendations: string[];
  clientSummary: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_WEBSITE_AUDIT_PROMPT = `Please perform a comprehensive, professional website, technical SEO, and conversion audit for {{businessName}} ({{category}} in {{location}}).
Website URL: {{website}}

Analyze:
1. Technical Health & Accessibility (SSL, meta tags, page speed indicators, mobile responsiveness).
2. User Experience (UX), layout, visual hierarchy, and CTA effectiveness.
3. Core missing features and conversion bottlenecks compared to top competitors in {{category}}.
4. High-impact recommendations and a client-ready pitch summary tailored for {{businessName}}.`;

export interface LeadFinderBusinessItem {
  id: string;
  businessName: string;
  rating?: number | null;
  totalReviews?: number | null;
  openClosed?: string | null;
  openingHours?: string | null;
  businessCategory?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
  fullAddress?: string | null;
  location?: string | null;
  googleMapsUrl?: string | null;
  foundAt: string;
  isSelected: boolean;
  leadId?: string | null;
  isConnected?: boolean;
  createdAt: string;
  updatedAt: string;
  emailVerification?: EmailVerificationResult;
  phoneVerification?: PhoneVerificationResult;
}

export interface FollowUpHistoryItem {
  id?: string;
  followUpNumber: number; // 1 or 2
  scheduledDate?: string; // YYYY-MM-DD
  sentAt?: string; // ISO string
  sentDate?: string; // YYYY-MM-DD
  channel: Channel;
  templateCategory?: string;
  templateName?: string;
  subject?: string;
  messagePreview?: string;
  notes?: string;
}

export interface FollowUpItem {
  id: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  channel: Channel;
  originalMessagePreview: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  status: FollowUpStatus;
  priority: Priority;
  notes?: string;
  completedAt?: string;

  // Cadence and step fields
  intervalDays?: number; // e.g. 2, 3, 5, 7
  currentStep?: number; // 1 = 1st follow-up, 2 = 2nd follow-up, 3 = completed
  originalMessageDate?: string; // YYYY-MM-DD
  templateCategory?: string;
  templateName?: string;
  subject?: string; // For email

  // Step dates
  firstFollowUpScheduledAt?: string;
  firstFollowUpSentAt?: string;
  secondFollowUpScheduledAt?: string;
  secondFollowUpSentAt?: string;

  // Rescheduling notice
  isRescheduled?: boolean;
  rescheduleNotice?: string;

  // Full history
  history?: FollowUpHistoryItem[];
}

export interface MessageTemplate {
  id: string;
  name: string; // e.g. "No Website", "Website Redesign", "SEO Improvement", "Booking System", "Custom Website", "Mobile App", "General Introduction"
  subject?: string;
  category: string;
  body: string;
  channels: Channel[];
}

export interface MapBusiness {
  id: string;
  name: string;
  category: string;
  niche: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website?: string;
  websiteStatus: WebsiteStatus;
  websiteAnalysis?: string;
  rating: number;
  reviewCount: number;
  priceLevel?: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  ceoName?: string;
  photos: string[];
  alreadyAdded?: boolean;
  isOpenNow?: boolean;
  verified?: boolean;
}

export interface SmtpConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  secure: boolean;
  lastTested?: string;
  isVerified?: boolean;
  hasSmtpPassword?: boolean;
}

export interface UserProfile {
  name: string;
  agencyName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  timezone: string;
}

export interface LeadFiltersState {
  search: string;
  websiteStatus: WebsiteStatus | 'all';
  leadStatus: LeadStatus | 'all';
  niche: string;
  location: string;
  channel: Channel | 'all';
  dateAdded: string;
  customStartDate?: string;
  customEndDate?: string;
  emailVerificationStatus?:
    | 'all'
    | 'not_checked'
    | 'valid'
    | 'invalid'
    | 'risky'
    | 'unknown'
    | 'disposable';
}
