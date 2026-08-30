import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMessageTemplate extends Document {
  userId: Types.ObjectId;
  name: string;
  category: string;
  subject?: string;
  message: string;
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "GENERAL",
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Template body is required"],
    },
    channels: {
      type: [String],
      default: ["email", "whatsapp", "linkedin"],
    },
  },
  {
    timestamps: true,
  }
);

MessageTemplateSchema.index({ userId: 1, category: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.MessageTemplate) {
  delete (mongoose.models as any).MessageTemplate;
}

export const MessageTemplate: Model<IMessageTemplate> =
  mongoose.models.MessageTemplate ||
  mongoose.model<IMessageTemplate>("MessageTemplate", MessageTemplateSchema);

export default MessageTemplate;
