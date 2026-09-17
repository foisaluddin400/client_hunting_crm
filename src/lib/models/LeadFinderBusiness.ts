import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILeadFinderBusiness extends Document {
  userId: Types.ObjectId;
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
  foundAt: Date;
  isConfirmed: boolean;
  leadId?: Types.ObjectId | null;
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

const LeadFinderBusinessSchema = new Schema<ILeadFinderBusiness>(
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
    rating: {
      type: Number,
      default: null,
    },
    totalReviews: {
      type: Number,
      default: null,
    },
    openClosed: {
      type: String,
      default: null,
      trim: true,
    },
    openingHours: {
      type: String,
      default: null,
      trim: true,
    },
    businessCategory: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    whatsapp: {
      type: String,
      default: null,
      trim: true,
    },
    facebook: {
      type: String,
      default: null,
      trim: true,
    },
    instagram: {
      type: String,
      default: null,
      trim: true,
    },
    linkedin: {
      type: String,
      default: null,
      trim: true,
    },
    twitter: {
      type: String,
      default: null,
      trim: true,
    },
    website: {
      type: String,
      default: null,
      trim: true,
    },
    fullAddress: {
      type: String,
      default: null,
      trim: true,
    },
    location: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    googleMapsUrl: {
      type: String,
      default: null,
      trim: true,
    },
    foundAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for isSelected backwards compatibility
LeadFinderBusinessSchema.virtual("isSelected")
  .get(function () {
    return this.isConfirmed;
  })
  .set(function (val: boolean) {
    this.isConfirmed = val;
  });

// Compound indexes for fast user-scoped queries and sorting
LeadFinderBusinessSchema.index({ userId: 1, businessName: 1 });
LeadFinderBusinessSchema.index({ userId: 1, foundAt: -1 });
LeadFinderBusinessSchema.index({ userId: 1, isConfirmed: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.LeadFinderBusiness) {
  delete (mongoose.models as any).LeadFinderBusiness;
}

export const LeadFinderBusiness: Model<ILeadFinderBusiness> =
  mongoose.models.LeadFinderBusiness ||
  mongoose.model<ILeadFinderBusiness>("LeadFinderBusiness", LeadFinderBusinessSchema);

export default LeadFinderBusiness;
