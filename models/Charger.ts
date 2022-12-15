import mongoose, { Schema } from "mongoose";
import { ICharger } from "../types/Charger";

interface DocumentResult<T> {
  _doc: T;
}

interface IChargerModel extends ICharger, DocumentResult<ICharger> {}

const ChargerSchema = new Schema<IChargerModel>(
  {
    chargerName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    unavailableTimes: [{ type: Date }],
  },
  { timestamps: true }
);

export default mongoose.model("Charger", ChargerSchema);
