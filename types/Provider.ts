import { Types } from "mongoose";

export interface IProvider {
  _id: Types.ObjectId;
  companyName: string;
  isAdmin: boolean;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  chargers: Array<Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}
