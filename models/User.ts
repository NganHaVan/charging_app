import mongoose, { Document, Types } from "mongoose";
import { IUser } from "../types/User";
const { Schema } = mongoose;

interface DocumentResult<T> {
  _doc: T;
}

interface IUserModel extends IUser, DocumentResult<IUser> {}

const ProviderSchema = new Schema<IUserModel>(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
    },
    bookingHours: [
      {
        startTime: { type: Date },
        endTime: { type: Date },
        chargerId: { type: Schema.Types.ObjectId, ref: "Charger" },
        status: { type: String, enum: ["unpaid", "paid"] },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IUserModel>("User", ProviderSchema);
