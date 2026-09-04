import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGoogleMapsSearch extends Document {
  userId: Types.ObjectId;
  category: string;
  country: string;
  city: string;
  query: string;
  createdAt: Date;
}

const GoogleMapsSearchSchema = new Schema<IGoogleMapsSearch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

GoogleMapsSearchSchema.index({ userId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.GoogleMapsSearch) {
  delete (mongoose.models as any).GoogleMapsSearch;
}

export const GoogleMapsSearch: Model<IGoogleMapsSearch> =
  mongoose.models.GoogleMapsSearch ||
  mongoose.model<IGoogleMapsSearch>("GoogleMapsSearch", GoogleMapsSearchSchema);

export default GoogleMapsSearch;
