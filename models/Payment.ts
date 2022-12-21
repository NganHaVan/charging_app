import mongoose, { Types } from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },
    chargerId: {
      type: Types.ObjectId,
      ref: "Charger",
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    totalBookingHour: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
