import Stripe from "stripe";
import { differenceInHours } from "date-fns";
import Charger from "../models/Charger";

export type CardInfo = {
  cardNumber: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
};

export const createPaymentSource = async (
  cardData: CardInfo
): Promise<string | null> => {
  const { cardNumber, cvc, exp_month, exp_year } = cardData;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
      apiVersion: "2022-11-15",
    });
    const token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        cvc,
        exp_month,
        exp_year,
      },
    });

    return token.id;
  } catch (error) {
    console.log("Error in createPaymentSource");
    console.log({ error });
    return null;
  }
};

type StripeChargeData = {
  amount: number;
  currency: string;
  cardInfo: CardInfo;
};

export const isChargedWithStripe = async (
  data: StripeChargeData
): Promise<boolean> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
      apiVersion: "2022-11-15",
    });
    const { amount, currency, cardInfo } = data;
    const source = await createPaymentSource(cardInfo);
    if (source) {
      const charge = await stripe.charges.create({
        amount: process.env.NODE_ENV === "testing" ? 50 : amount,
        currency,
        source,
      });
      if (charge.status === "succeeded") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error in isChargedWithStripe");
    console.log({ error });
    return false;
  }
};

export const getBookingAmount = async ({
  startTime,
  endTime,
  chargerId,
}: {
  startTime: Date;
  endTime: Date;
  chargerId: string;
}) => {
  try {
    const foundCharger = await Charger.findById(chargerId);
    if (foundCharger) {
      const hourDifference = differenceInHours(
        new Date(endTime),
        new Date(startTime)
      );
      return foundCharger.pricePerHour * hourDifference;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error in getBookingAmount");
    console.log({ error });
    return null;
  }
};
