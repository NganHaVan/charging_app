import { Types } from "mongoose";

export interface IUser {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  bookingHours: Array<{ startTime: Date; endTime: Date; chargerId: string }>;
}
