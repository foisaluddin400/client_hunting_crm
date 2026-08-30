import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DbOutreachChannel =
  | "EMAIL"
  | "WHATSAPP"
  | "LINKEDIN"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TWITTER"
  | "SYSTEM"
  | "CALL"
  | "NOTE";

export type DbOutreachStatus =
  | "DRAFT"
  | "PREPARED"
  | "SENT"
  | "REPLIED"
  | "FAILED"
  | "COMPLETED";

export interface IOutreachActivity extends Document {
  userId: Types.ObjectId;
  leadId: Types.ObjectId;
  channel: DbOutreachChannel;
  recipient?: string;
  subject?: string;
  message: string;
  status: DbOutreachStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachActivitySchema = new Schema<IOutreachActivity>(
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
    channel: {
      type: String,
      enum: [
        "EMAIL",
        "WHATSAPP",
        "LINKEDIN",
        "INSTAGRAM",
        "FACEBOOK",
        "TWITTER",
        "SYSTEM",
        "CALL",
        "NOTE",
      ],
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    status: {
      type: String,
      enum: ["DRAFT", "PREPARED", "SENT", "REPLIED", "FAILED", "COMPLETED"],
      default: "PREPARED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OutreachActivitySchema.index({ userId: 1, leadId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.OutreachActivity) {
  delete (mongoose.models as any).OutreachActivity;
}

export const OutreachActivity: Model<IOutreachActivity> =
  mongoose.models.OutreachActivity ||
  mongoose.model<IOutreachActivity>("OutreachActivity", OutreachActivitySchema);

export default OutreachActivity;
