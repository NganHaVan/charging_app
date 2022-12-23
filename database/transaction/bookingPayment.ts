import { getMongoClient } from "../../config/db";
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
  currency,
}: {
  startTime: Date;
  endTime: Date;
  chargerId: string;
  userId: string;
  cardInfo: CardInfo;
  currency: string;
}) {
  const client = await getMongoClient();

  const session = client.startSession();

  try {
    const totalAmount = await getBookingAmount({
      startTime,
      endTime,
      chargerId,
    });
    if (totalAmount) {
      const isPaymentSuccessful = await isChargedWithStripe({
        amount: totalAmount,
        cardInfo,
        currency,
      });
      if (isPaymentSuccessful) {
        await session.withTransaction(
          async () => {
            // Update user booking charger status in User model
            await User.findOneAndUpdate(
              {
                _id: userId,
                "bookingHours.id": chargerId,
                "bookingHours.startTime": new Date(startTime).toISOString(),
                "bookingHours.endTime": new Date(endTime).toISOString(),
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
                totalBookingHour: differenceInHours(
                  new Date(endTime),
                  new Date(startTime)
                ),
                totalPrice: totalAmount,
              },
              { timestamps: { createdAt: true } }
            );

            session.commitTransaction();
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
