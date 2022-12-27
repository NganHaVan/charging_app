import supertest from "supertest";
import dotenv from "dotenv";

import { createServer } from "../../config/server";
import {
  disconnectDBConnection,
  starDBConnection,
  dropDB,
  dropCollections,
} from "../../mock/dbConnectionMock";
import { IProvider } from "../../types/Provider";
import { ICharger } from "../../types/Charger";
import { addProvider1ToDb } from "../../mock/providerMock";
import { addCharger1ToDb } from "../../mock/chargerMock";
import { IUser } from "../../types/User";
import { addUser1ToDb, addUser2ToDb, bookACharger } from "../../mock/userMock";
import { generateAccessToken } from "../../utils/cookies";
import { addHours } from "date-fns";
import DEFAULT_CREDIT_CARD from "../../mock/paymentCard";
import { generateStripeSecretKey } from "../../config/stripe";

dotenv.config();
process.env.JWT = "test_secret";
process.env.NODE_ENV = "testing";
const app = createServer();

const later2Hours = addHours(new Date(), 2);
const later3Hours = addHours(new Date(), 3);
const later4Hours = addHours(new Date(), 4);

const startTime = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate(),
  new Date(later2Hours).getHours(),
  0
);
const endTime = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  new Date().getDate(),
  new Date(later4Hours).getHours(),
  0
);

describe("Payment API", () => {
  let testProvider1: IProvider;
  let testCharger1: ICharger;
  let testUser1: IUser;
  let testUser2: IUser;

  const { number, cvc, exp_month, exp_year } = DEFAULT_CREDIT_CARD;
  beforeAll(async () => {
    const conn = await starDBConnection();
    process.env.MONGO_URI = conn.getUri();
    process.env.STRIPE_SECRET = generateStripeSecretKey();
  });
  afterAll(async () => {
    await dropDB();
    await disconnectDBConnection();
  });

  afterEach(async () => {
    await dropCollections();
  });

  beforeEach(async () => {
    testUser1 = await addUser1ToDb();
    testUser2 = await addUser2ToDb();
    testProvider1 = await addProvider1ToDb();
    testCharger1 = await addCharger1ToDb(testProvider1);

    await bookACharger({
      chargerId: testCharger1._id,
      userId: testUser1._id,
      startTime,
      endTime,
    });
  });

  describe("/:id/payment", () => {
    describe("POST", () => {
      it("should return 200", async () => {
        const token = generateAccessToken(testUser1, process.env.JWT);

        const { body, statusCode } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
          .send({
            startTime,
            endTime,
            cardNumber: number,
            cvc,
            exp_month,
            exp_year,
            currency: "EUR",
          })
          .set("Cookie", `access_token=${token}`);

        expect(statusCode).toBe(200);
        expect(body.detail.chargerId._id).toBe(testCharger1._id.valueOf());
        expect(body.detail.userId.bookingHours[0].status).toBe("paid");
      });

      it("should return 400 when trying to book overlapping time", async () => {
        const userToken1 = generateAccessToken(testUser1, process.env.JWT);
        const userToken2 = generateAccessToken(testUser2, process.env.JWT);

        await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
          .send({
            startTime,
            endTime,
            cardNumber: number,
            cvc,
            exp_month,
            exp_year,
            currency: "EUR",
          })
          .set("Cookie", `access_token=${userToken1}`);

        const { body, statusCode } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/booking`)
          .send({
            startTime: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              new Date().getDate(),
              new Date(later3Hours).getHours(),
              0
            ),
            endTime,
          })
          .set("Cookie", `access_token=${userToken2}`);

        expect(statusCode).toBe(400);
        expect(body.message).toMatch("Your booking time is unavailable");
      });

      it("checks the booking hours are sorted by time", async () => {
        const token = generateAccessToken(testUser1, process.env.JWT);
        const startTime2 = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(addHours(new Date(), 6)).getHours(),
          0
        );
        const endTime2 = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(addHours(new Date(), 8)).getHours(),
          0
        );
        await bookACharger({
          userId: testUser1._id.valueOf(),
          chargerId: testCharger1._id.valueOf(),
          startTime: startTime2,
          endTime: endTime2,
        });

        await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
          .send({
            startTime,
            endTime,
            cardNumber: number,
            cvc,
            exp_month,
            exp_year,
            currency: "EUR",
          })
          .set("Cookie", `access_token=${token}`);

        const { body } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
          .send({
            startTime: startTime2,
            endTime: endTime2,
            cardNumber: number,
            cvc,
            exp_month,
            exp_year,
            currency: "EUR",
          })
          .set("Cookie", `access_token=${token}`);
        expect(
          new Date(body.detail.userId.bookingHours[0].startTime).getTime()
        ).toBeLessThan(
          new Date(body.detail.userId.bookingHours[1].startTime).getTime()
        );

        const { body: chargerBody, statusCode: chargerStatusCode } =
          await supertest(app)
            .get(`/api/chargers/${testCharger1._id.valueOf()}`)
            .set("Cookie", `access_token=${token}`);

        expect(chargerStatusCode).toBe(200);
        expect(chargerBody.unavailableTimes.length).toBe(2);
        expect(
          new Date(chargerBody.unavailableTimes[0].startTime).getTime()
        ).toBeLessThan(
          new Date(chargerBody.unavailableTimes[1].startTime).getTime()
        );
      });

      // it("returns 500 when paying a booking twice", async () => {
      //   const token = generateAccessToken(testUser1, process.env.JWT);
      //   console.log("====== TESTTTT ======");

      //   await supertest(app)
      //     .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
      //     .send({
      //       startTime,
      //       endTime,
      //       cardNumber: number,
      //       cvc,
      //       exp_month,
      //       exp_year,
      //       currency: "EUR",
      //     })
      //     .set("Cookie", `access_token=${token}`);

      //   const { statusCode } = await supertest(app)
      //     .post(`/api/chargers/${testCharger1._id.valueOf()}/payment`)
      //     .send({
      //       startTime,
      //       endTime,
      //       cardNumber: number,
      //       cvc,
      //       exp_month,
      //       exp_year,
      //       currency: "EUR",
      //     })
      //     .set("Cookie", `access_token=${token}`);
      //   console.log(" ============= ");
      //   expect(statusCode).toBe(500);
      // });
    });
  });
});
