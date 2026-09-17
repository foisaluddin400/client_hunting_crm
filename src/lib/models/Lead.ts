import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DbWebsiteStatus =
  | "NO_WEBSITE"
  | "REDESIGN"
  | "SEO_PERFORMANCE"
  | "OTHER";

export type DbLeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "CONTACTED"
  | "CONNECTED"
  | "REPLIED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "MEETING"
  | "PROPOSAL"
  | "WON"
  | "LOST";

export interface ILead extends Document {
  userId: Types.ObjectId;
  businessName: string;
  ceoName?: string;
  industry: string; // e.g. "Restaurants", "Real Estate Agencies", "Cleaning Services"
  location: string;
  website?: string;
  websiteStatus: DbWebsiteStatus;
  email?: string;
  whatsapp?: string;
  phone?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  leadStatus: DbLeadStatus;
  leadScore: number;
  notes?: string;
  avatarColor?: string;
  lastContactAt?: Date;
  finderBusinessId?: Types.ObjectId;
  foundAt?: Date;
  googleMapsUrl?: string;
  link?: string;
  auditStatus?: "NOT_AUDITED" | "AUDITING" | "COMPLETED" | "FAILED";
  auditScore?: number;
  lastAuditedAt?: Date;
  originalSenderEmail?: string;
  originalOutreachType?: string;
  emailVerification?: {
    status: "not_checked" | "valid" | "invalid" | "risky" | "unknown";
    syntaxValid?: boolean;
    domainExists?: boolean | null;
    mxRecord?: boolean | null;
    mailServer?: boolean | null;
    spf?: boolean | null;
    dmarc?: boolean | null;
    disposable?: boolean;
    freeProvider?: boolean;
    roleBased?: boolean;
    smtpStatus?: "available" | "inconclusive" | "rejected" | "unknown";
    catchAll?: boolean | "unknown";
    emailType?: string;
    mxRecords?: string[];
    checkedAt?: Date;
    verificationMethod?: string;
    details?: string;
  };
  phoneVerification?: {
    status: "not_checked" | "valid" | "invalid" | "risky" | "unknown";
    valid?: boolean;
    possible?: boolean;
    country?: string;
    countryCode?: string;
    regionCode?: string;
    numberType?: string;
    internationalFormat?: string;
    nationalFormat?: string;
    e164Format?: string;
    whatsappStatus?: "yes" | "no" | "unknown";
    checkedAt?: Date;
    verificationMethod?: string;
    details?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      index: true,
    },
    ceoName: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      default: "Restaurants",
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    website: {
      type: String,
      trim: true,
    },
    websiteStatus: {
      type: String,
      enum: ["NO_WEBSITE", "REDESIGN", "SEO_PERFORMANCE", "OTHER"],
      default: "NO_WEBSITE",
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    facebook: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    leadStatus: {
      type: String,
      enum: [
        "NEW",
        "QUALIFIED",
        "CONTACTED",
        "CONNECTED",
        "REPLIED",
        "INTERESTED",
        "FOLLOW_UP",
        "MEETING",
        "PROPOSAL",
        "WON",
        "LOST",
      ],
      default: "NEW",
      index: true,
    },
    leadScore: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
    },
    avatarColor: {
      type: String,
      default: "bg-indigo-600",
    },
    lastContactAt: {
      type: Date,
    },
    finderBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LeadFinderBusiness",
      index: true,
    },
    foundAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    googleMapsUrl: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    auditStatus: {
      type: String,
      enum: ["NOT_AUDITED", "AUDITING", "COMPLETED", "FAILED"],
      default: "NOT_AUDITED",
      index: true,
    },
    auditScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    lastAuditedAt: {
      type: Date,
    },
    originalSenderEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    originalOutreachType: {
      type: String,
      trim: true,
    },
    emailVerification: {
      status: {
        type: String,
        enum: ["not_checked", "valid", "invalid", "risky", "unknown"],
        default: "not_checked",
        index: true,
      },
      syntaxValid: { type: Boolean, default: false },
      domainExists: { type: Boolean, default: null },
      mxRecord: { type: Boolean, default: null },
      mailServer: { type: Boolean, default: null },
      spf: { type: Boolean, default: null },
      dmarc: { type: Boolean, default: null },
      disposable: { type: Boolean, default: false },
      freeProvider: { type: Boolean, default: false },
      roleBased: { type: Boolean, default: false },
      smtpStatus: {
        type: String,
        enum: ["available", "inconclusive", "rejected", "unknown"],
        default: "unknown",
      },
      catchAll: { type: Schema.Types.Mixed, default: "unknown" },
      emailType: { type: String, default: "Business Email" },
      mxRecords: [{ type: String }],
      checkedAt: { type: Date },
      verificationMethod: { type: String, default: "free_local" },
      details: { type: String },
    },
    phoneVerification: {
      status: {
        type: String,
        enum: ["not_checked", "valid", "invalid", "risky", "unknown"],
        default: "not_checked",
        index: true,
      },
      valid: { type: Boolean, default: false },
      possible: { type: Boolean, default: false },
      country: { type: String, default: "Unknown" },
      countryCode: { type: String, default: "" },
      regionCode: { type: String, default: "" },
      numberType: { type: String, default: "Unknown" },
      internationalFormat: { type: String },
      nationalFormat: { type: String },
      e164Format: { type: String },
      whatsappStatus: {
        type: String,
        enum: ["yes", "no", "unknown"],
        default: "unknown",
      },
      checkedAt: { type: Date },
      verificationMethod: { type: String, default: "free_local" },
      details: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance user-scoped queries
LeadSchema.index({ userId: 1, leadStatus: 1 });
LeadSchema.index({ userId: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, businessName: 1 });
LeadSchema.index({ userId: 1, industry: 1 });
LeadSchema.index({ userId: 1, location: 1 });
LeadSchema.index({ userId: 1, websiteStatus: 1 });
LeadSchema.index({ userId: 1, "emailVerification.status": 1 });
LeadSchema.index({ userId: 1, "phoneVerification.status": 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Lead) {
  delete (mongoose.models as any).Lead;
}

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
