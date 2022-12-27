import { Types } from "mongoose";

export interface ICharger {
  _id: string;
  chargerName: string;
  pricePerHour: number;
  location: string;
  companyId: Types.ObjectId;
  unavailableTimes: Array<{ startTime: Date; endTime: Date }>;
}
