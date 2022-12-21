import Stripe from "stripe";
import _ from "date-fns";
import Charger from "../models/Charger";
const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
  apiVersion: "2022-11-15",
});

export type CardInfo = {
  cardNumber: string;
  currency: string;
  country: string;
};

export const createPaymentSource = async (
  cardData: CardInfo
): Promise<string | null> => {
  const { cardNumber, country, currency } = cardData;
  try {
    const token = await stripe.tokens.create({
      bank_account: {
        country,
        currency,
        account_number: cardNumber,
      },
    });
    return token.id;
  } catch (error) {
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
    const { amount, currency, cardInfo } = data;
    const source = await createPaymentSource(cardInfo);
    if (source) {
      const charge = await stripe.charges.create({
        amount,
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
      const hourDifference = _.differenceInHours(startTime, endTime);
      return foundCharger.pricePerHour * hourDifference;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
