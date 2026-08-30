import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DbFollowUpStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "OVERDUE";
export type DbPriority = "HIGH" | "MEDIUM" | "LOW";

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
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  {
    timestamps: true,
  }
);

FollowUpSchema.index({ userId: 1, status: 1, scheduledAt: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.FollowUp) {
  delete (mongoose.models as any).FollowUp;
}

export const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp ||
  mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);

export default FollowUp;
