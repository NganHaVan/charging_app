import { PopulatedDoc, Types } from "mongoose";
import { ICharger } from "./Charger";

export enum BookingStatus {
  PAID = "paid",
  UNPAID = "unpaid",
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  bookingHours: Array<{
    startTime: Date;
    endTime: Date;
    chargerId: PopulatedDoc<ICharger>;
    status?: BookingStatus;
  }>;
}
