import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DbFollowUpStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "OVERDUE";
export type DbPriority = "HIGH" | "MEDIUM" | "LOW";

export interface IFollowUpHistoryEntry {
  followUpNumber: number; // 1 or 2
  scheduledDate?: string; // YYYY-MM-DD
  sentAt?: Date; // Actual send timestamp
  sentDate?: string; // YYYY-MM-DD
  channel: string; // email, whatsapp, facebook, etc.
  templateCategory?: string; // e.g. "No Website"
  templateName?: string; // e.g. "No Website (template-1)"
  subject?: string; // for email
  messagePreview?: string;
  notes?: string;
}

export interface IFollowUp extends Document {
  userId: Types.ObjectId;
  leadId: Types.ObjectId;
  channel: string;
  message?: string;
  notes?: string;
  scheduledAt: Date;
  dueTime?: string;
  status: DbFollowUpStatus;
  priority: DbPriority;
  completedAt?: Date;

  // Multi-step Follow-up Cadence Fields
  intervalDays?: number; // e.g. 2, 3, 5, 7
  currentStep: number; // 1 = 1st follow-up pending, 2 = 2nd follow-up pending, 3 = completed
  originalMessageDate?: Date;
  originalMessagePreview?: string;
  templateCategory?: string; // e.g. "No Website"
  templateName?: string; // e.g. "No Website (template-1)"
  subject?: string; // Email Subject line

  // Step dates
  firstFollowUpScheduledAt?: Date;
  firstFollowUpSentAt?: Date;
  secondFollowUpScheduledAt?: Date;
  secondFollowUpSentAt?: Date;

  // Reschedule status
  isRescheduled?: boolean;
  rescheduleNotice?: string;

  // History entries
  history: IFollowUpHistoryEntry[];

  createdAt: Date;
  updatedAt: Date;
}

const FollowUpHistorySchema = new Schema<IFollowUpHistoryEntry>(
  {
    followUpNumber: { type: Number, required: true },
    scheduledDate: { type: String },
    sentAt: { type: Date },
    sentDate: { type: String },
    channel: { type: String, required: true },
    templateCategory: { type: String, trim: true },
    templateName: { type: String, trim: true },
    subject: { type: String, trim: true },
    messagePreview: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true, timestamps: false }
);

const FollowUpSchema = new Schema<IFollowUp>(
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
      default: "email",
      index: true,
    },
    message: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled date is required"],
      index: true,
    },
    dueTime: {
      type: String,
      default: "10:00 AM",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED", "OVERDUE"],
      default: "PENDING",
      index: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    completedAt: {
      type: Date,
    },

    // Multi-step Follow-up Cadence Fields
    intervalDays: {
      type: Number,
      default: 3,
    },
    currentStep: {
      type: Number,
      default: 1, // 1 for 1st follow-up, 2 for 2nd follow-up, 3 for completed
    },
    originalMessageDate: {
      type: Date,
    },
    originalMessagePreview: {
      type: String,
      trim: true,
    },
    templateCategory: {
      type: String,
      trim: true,
    },
    templateName: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },

    // Step dates
    firstFollowUpScheduledAt: {
      type: Date,
    },
    firstFollowUpSentAt: {
      type: Date,
    },
    secondFollowUpScheduledAt: {
      type: Date,
    },
    secondFollowUpSentAt: {
      type: Date,
    },

    // Reschedule tracking
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    rescheduleNotice: {
      type: String,
      trim: true,
    },

    // Permanent history entries
    history: {
      type: [FollowUpHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FollowUpSchema.index({ userId: 1, leadId: 1, channel: 1 });
FollowUpSchema.index({ userId: 1, status: 1, scheduledAt: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.FollowUp) {
  delete (mongoose.models as any).FollowUp;
}

export const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp ||
  mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);

export default FollowUp;
