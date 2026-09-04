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
  website?: string | null;
  fullAddress?: string | null;
  googleMapsUrl?: string | null;
  foundAt: Date;
  isConfirmed: boolean;
  leadId?: Types.ObjectId | null;
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
