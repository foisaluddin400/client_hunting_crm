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

if (process.env.NODE_ENV !== "production" && mongoose.models.Lead) {
  delete (mongoose.models as any).Lead;
}

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
