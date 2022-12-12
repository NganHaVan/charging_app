import mongoose, { Document } from "mongoose";
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
  },
  { timestamps: true }
);

export default mongoose.model<IUserModel>("Provider", ProviderSchema);
