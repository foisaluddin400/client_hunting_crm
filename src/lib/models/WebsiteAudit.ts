import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditCheckStatus = "Passed" | "Needs improvement" | "Failed" | "N/A";

export interface IAuditCheck {
  id: string;
  label: string;
  status: AuditCheckStatus;
  value?: string;
  message: string;
  whyItMatters: string;
}

export interface IAuditProblem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface IWebsiteAudit extends Document {
  userId: Types.ObjectId;
  leadId: Types.ObjectId;
  url: string;
  status: "AUDITING" | "COMPLETED" | "FAILED";
  overallScore: number;
  scores: {
    pageSpeed: number;
    lighthouse: number;
    mobile: number;
    uxTechnicalDesign: number;
  };
  checks: IAuditCheck[];
  problems: IAuditProblem[];
  recommendedImprovements: string[];
  recommendedFeatures: string[];
  businessRecommendations: string[];
  clientSummary: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteAuditSchema = new Schema<IWebsiteAudit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["AUDITING", "COMPLETED", "FAILED"],
      default: "AUDITING",
      index: true,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scores: {
      pageSpeed: { type: Number, default: 0 },
      lighthouse: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      uxTechnicalDesign: { type: Number, default: 0 },
    },
    checks: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        status: {
          type: String,
          enum: ["Passed", "Needs improvement", "Failed", "N/A"],
          required: true,
        },
        value: { type: String },
        message: { type: String, required: true },
        whyItMatters: { type: String, required: true },
      },
    ],
    problems: [
      {
        id: { type: String, required: true },
        severity: { type: String, enum: ["high", "medium", "low"], required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    recommendedImprovements: {
      type: [String],
      default: [],
    },
    recommendedFeatures: {
      type: [String],
      default: [],
    },
    businessRecommendations: {
      type: [String],
      default: [],
    },
    clientSummary: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

WebsiteAuditSchema.index({ userId: 1, leadId: 1 });
WebsiteAuditSchema.index({ leadId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.WebsiteAudit) {
  delete (mongoose.models as any).WebsiteAudit;
}

export const WebsiteAudit: Model<IWebsiteAudit> =
  mongoose.models.WebsiteAudit ||
  mongoose.model<IWebsiteAudit>("WebsiteAudit", WebsiteAuditSchema);

export default WebsiteAudit;
