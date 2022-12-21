import mongoose, { Types } from "mongoose";
import { IProvider } from "../types/Provider";
const { Schema } = mongoose;

interface DocumentResult<T> {
  _doc: T;
}

interface IProviderModel extends IProvider, DocumentResult<IProvider> {}

const ProviderSchema = new Schema<IProviderModel>(
  {
    companyName: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    chargers: {
      type: [Types.ObjectId],
      default: [],
      ref: "Charger",
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Provider", ProviderSchema);
