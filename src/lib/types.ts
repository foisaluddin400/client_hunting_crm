export type WebsiteStatus = 'No Website' | 'Redesign' | 'SEO Performance' | 'Other';

export type LeadStatus =
  | 'New'
  | 'Qualified'
  | 'Contacted'
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
  notes?: string;
  activities: ActivityItem[];
  avatarColor?: string;
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
}
