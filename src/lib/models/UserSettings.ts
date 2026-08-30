import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserSettings extends Document {
  userId: Types.ObjectId;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  fromName?: string;
  fromEmail?: string;
  secure?: boolean;
  isVerified?: boolean;
  lastTested?: Date;
  businessCategories?: string[];
  targetCountries?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    smtpHost: {
      type: String,
      trim: true,
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUsername: {
      type: String,
      trim: true,
    },
    smtpPassword: {
      type: String,
      select: false, // Never return raw SMTP password in normal queries
    },
    fromName: {
      type: String,
      trim: true,
    },
    fromEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    secure: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastTested: {
      type: Date,
    },
    businessCategories: {
      type: [String],
      default: undefined,
    },
    targetCountries: {
      type: [String],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.UserSettings) {
  delete (mongoose.models as any).UserSettings;
}

export const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export default UserSettings;
