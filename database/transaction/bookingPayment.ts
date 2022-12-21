import e from "express";
import { mongoClient } from "../../config/db";
import {
  CardInfo,
  getBookingAmount,
  isChargedWithStripe,
} from "../../utils/paymentUtils";
import User from "../../models/User";
import Charger from "../../models/Charger";
import Payment from "../../models/Payment";
import { differenceInHours } from "date-fns";

async function bookingPayment({
  startTime,
  endTime,
  chargerId,
  userId,
  cardInfo,
}: {
  startTime: Date;
  endTime: Date;
  chargerId: string;
  userId: string;
  cardInfo: CardInfo;
}) {
  const session = mongoClient.startSession();

  try {
    const totalAmount = await getBookingAmount({
      startTime,
      endTime,
      chargerId,
    });
    if (totalAmount) {
      const isPaymentSuccessful = await isChargedWithStripe({
        amount: 10,
        cardInfo,
        currency: "EUR",
      });
      if (isPaymentSuccessful) {
        const transactionResults = await session.withTransaction(
          async () => {
            // Update user booking charger status in User model
            await User.findOneAndUpdate(
              {
                _id: userId,
                "bookingHours.id": chargerId,
                "bookingHours.startTime": startTime,
                "bookingHours.endTime": endTime,
              },
              {
                $set: {
                  "bookingHours.$.status": "paid",
                },
              },
              { session }
            ).sort({ "bookingHours.startTime": 1 });

            //  Update unavailableTimes in charger model
            await Charger.findByIdAndUpdate(
              chargerId,
              {
                $push: {
                  unavailableTimes: {
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                  },
                },
              },
              { session }
            ).sort({ "unavailableTimes.startTime": "ascending" });
            // Create a payment document
            await Payment.create(
              {
                userId,
                chargerId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                totalBookingHour: differenceInHours(startTime, endTime),
                totalPrice: totalAmount,
              },
              { timestamps: { createdAt: true } }
            );
          },
          {
            readPreference: "primary",
            readConcern: { level: "local" },
            writeConcern: { w: "majority" },
          }
        );
      } else {
        throw new Error("Cannot create charger with Stripe");
      }
    } else {
      throw new Error("Cannot calculate the total amount");
    }
  } catch (error) {
    console.log(
      "The order was not successful. The transaction was aborted due to an unexpected error: " +
        error
    );
    session.abortTransaction();
    // @ts-ignore
    throw new Error(error.message ?? "The order was not successfully");
  } finally {
    session.endSession();
  }
}

export default bookingPayment;
