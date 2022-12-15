import { Types } from "mongoose";

export interface IProvider {
  _id: string;
  companyName: string;
  isAdmin: boolean;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  chargers: Array<string>;
  createdAt?: Date;
  updatedAt?: Date;
  password: string;
}
