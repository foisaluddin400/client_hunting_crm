import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  agencyName: z.string().optional(),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export const websiteStatusEnum = z.enum([
  "NO_WEBSITE",
  "REDESIGN",
  "SEO_PERFORMANCE",
  "OTHER",
  "No Website",
  "Redesign",
  "SEO Performance",
  "Other",
]);

export const leadStatusEnum = z.enum([
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "FOLLOW_UP",
  "MEETING",
  "PROPOSAL",
  "WON",
  "LOST",
  "New",
  "Qualified",
  "Contacted",
  "Replied",
  "Interested",
  "Follow-up",
  "Meeting",
  "Proposal",
  "Won",
  "Lost",
]);

export const leadCreateSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ceoName: z.string().optional(),
  industry: z.string().optional(),
  niche: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  website: z.string().optional(),
  websiteStatus: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  leadStatus: z.string().optional(),
  status: z.string().optional(),
  leadScore: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  avatarColor: z.string().optional(),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const outreachCreateSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  channel: z.string().min(1, "Channel is required"),
  recipient: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const emailSendSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  recipient: z.string().email("Valid recipient email is required"),
  subject: z.string().min(1, "Subject line is required"),
  message: z.string().min(1, "Email message body is required"),
});

export const followUpCreateSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  channel: z.string().optional().default("email"),
  message: z.string().optional(),
  notes: z.string().optional(),
  scheduledAt: z.string().min(1, "Scheduled date is required"),
  dueTime: z.string().optional().default("10:00 AM"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "high", "medium", "low"]).optional().default("medium"),
});

export const followUpUpdateSchema = z.object({
  channel: z.string().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
  dueTime: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().optional().default("GENERAL"),
  subject: z.string().optional(),
  message: z.string().min(1, "Template body is required"),
  channels: z.array(z.string()).optional(),
});

export const settingsUpdateSchema = z.object({
  name: z.string().optional(),
  agencyName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  timezone: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional().or(z.literal("")),
  secure: z.boolean().optional(),
});
