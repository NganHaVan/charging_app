import supertest from "supertest";
import dotenv from "dotenv";

import { createServer } from "../../config/server";
import {
  disconnectDBConnection,
  starDBConnection,
  dropDB,
  dropCollections,
} from "../../mock/dbConnectionMock";
import { IUser } from "../../types/User";
import { addUser1ToDb, addUser2ToDb, bookACharger } from "../../mock/userMock";
import { addProvider1ToDb } from "../../mock/providerMock";
import { generateAccessToken } from "../../utils/cookies";
import { addCharger1ToDb, payACharger } from "../../mock/chargerMock";
import { addHours } from "date-fns";
import DEFAULT_CREDIT_CARD from "../../mock/paymentCard";
import { generateStripeSecretKey } from "../../config/stripe";

dotenv.config();
process.env.JWT = "test_secret";
process.env.NODE_ENV = "testing";
const app = createServer();

const { cvc, exp_month, exp_year, number } = DEFAULT_CREDIT_CARD;

describe("User API", () => {
  let testUser1: IUser;
  let testUser2: IUser;

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
  });

  describe("/:userId", () => {
    describe("GET", () => {
      it("should return 200 for both provider and user", async () => {
        const testProvider1 = await addProvider1ToDb();
        if (testUser1) {
          const user1AccessToken = generateAccessToken(
            testUser1,
            process.env.JWT
          );
          const { statusCode: userStatusCode } = await supertest(app)
            .get(`/api/users/${testUser1._id.valueOf()}`)
            .set("Cookie", `access_token=${user1AccessToken}`);
          expect(userStatusCode).toBe(200);

          const providerAccessToken = generateAccessToken(
            testProvider1,
            process.env.JWT
          );
          const { statusCode: providerStatusCode } = await supertest(app)
            .get(`/api/users/${testUser1._id.valueOf()}`)
            .set("Cookie", `access_token=${providerAccessToken}`);
          expect(providerStatusCode).toBe(200);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });

      it("should return 401 for unregistered people", async () => {
        if (testUser1) {
          const { statusCode } = await supertest(app).get(
            `/api/users/${testUser1._id.valueOf()}`
          );
          expect(statusCode).toBe(401);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });
    });

    describe("PUT", () => {
      it("should return 200 for the owner account", async () => {
        if (testUser1) {
          const token = generateAccessToken(testUser1, process.env.JWT);
          const newEmail = "test@mail.com";
          const newUsername = "New test username";
          const { statusCode, body } = await supertest(app)
            .put(`/api/users/${testUser1._id}`)
            .send({
              password: "222222",
              email: newEmail,
              username: newUsername,
            })
            .set("Cookie", [`access_token=${token}`]);

          expect(statusCode).toBe(200);
          expect(body._id).toBe(testUser1._id.valueOf());
          expect(body.email).toBe(newEmail);
          expect(body.username).toBe(newUsername);
          expect(body.phoneNumber).toBe(testUser1.phoneNumber);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });

      it("should return 403 for NOT_THE_OWNER", async () => {
        if (testUser1 && testUser2) {
          const user2AccessToken = generateAccessToken(
            testUser2,
            process.env.JWT
          );
          const { statusCode } = await supertest(app)
            .put(`/api/users/${testUser1._id}`)
            .send({
              email: "test@mail.com",
              username: "Test User",
            })
            .set("Cookie", [`access_token=${user2AccessToken}`]);
          expect(statusCode).toBe(403);
        } else {
          throw new Error("User 1 and User 2 has not been added to db");
        }
      });

      it("should return 401 for unregistered people", async () => {
        if (testUser1) {
          const { statusCode } = await supertest(app)
            .put(`/api/users/${testUser1._id}`)
            .send({
              email: "test@mail.com",
              username: "Test User",
            });
          expect(statusCode).toBe(401);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });

      it("should return 400 for updating existing phoneNumber", async () => {
        if (testUser1 && testUser2) {
          const token = generateAccessToken(testUser1, process.env.JWT);
          const { statusCode } = await supertest(app)
            .put(`/api/users/${testUser1._id}`)
            .send({
              phoneNumber: testUser2.phoneNumber,
            })
            .set("Cookie", [`access_token=${token}`]);
          expect(statusCode).toBe(400);
        } else {
          throw new Error("User 1 and User 2 have not been added to db");
        }
      });
    });

    describe("DELETE", () => {
      it("should return 200 for the owner account", async () => {
        if (testUser1) {
          const token = generateAccessToken(testUser1, process.env.JWT);
          const { statusCode } = await supertest(app)
            .delete(`/api/users/${testUser1._id}`)
            .set("Cookie", [`access_token=${token}`]);

          expect(statusCode).toBe(200);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });

      it("should return 403 for NOT_THE_OWNER", async () => {
        if (testUser1 && testUser2) {
          const user2AccessToken = generateAccessToken(
            testUser2,
            process.env.JWT
          );
          const { statusCode } = await supertest(app)
            .delete(`/api/users/${testUser1._id}`)
            .set("Cookie", [`access_token=${user2AccessToken}`]);

          expect(statusCode).toBe(403);
        } else {
          throw new Error("User 1 and User 2 have not been added to db");
        }
      });

      it("should return 401 for unregistered people", async () => {
        if (testUser1) {
          const { statusCode } = await supertest(app).delete(
            `/api/users/${testUser1._id}`
          );

          expect(statusCode).toBe(401);
        } else {
          throw new Error("User 1 has not been added to db");
        }
      });
    });
  });

  describe("/:userId/historyPayment", () => {
    it("returns 200", async () => {
      const testProvider1 = await addProvider1ToDb();
      const testCharger1 = await addCharger1ToDb(testProvider1);
      const user1AccessToken = generateAccessToken(testUser1, process.env.JWT);

      const startTime = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        new Date(addHours(new Date(), 2)).getHours(),
        0
      );
      const endTime = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        new Date(addHours(new Date(), 4)).getHours(),
        0
      );

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
        chargerId: testCharger1._id.valueOf(),
        userId: testUser1._id.valueOf(),
        startTime,
        endTime,
      });
      await payACharger({
        startTime,
        endTime,
        chargerId: testCharger1._id.valueOf(),
        userId: testUser1._id.valueOf(),
        cardInfo: {
          cardNumber: number,
          cvc,
          exp_month,
          exp_year,
        },
      });

      await bookACharger({
        chargerId: testCharger1._id.valueOf(),
        userId: testUser1._id.valueOf(),
        startTime: startTime2,
        endTime: endTime2,
      });
      await payACharger({
        startTime: startTime2,
        endTime: endTime2,
        chargerId: testCharger1._id.valueOf(),
        userId: testUser1._id.valueOf(),
        cardInfo: {
          cardNumber: number,
          cvc,
          exp_month,
          exp_year,
        },
      });

      const { statusCode, body } = await supertest(app)
        .get(`/api/users/${testUser1._id.valueOf()}/history_payment`)
        .set("Cookie", `access_token=${user1AccessToken}`);
      // console.log({ body: JSON.stringify(body, null, 4) });
      expect(statusCode).toBe(200);
      expect(body.length).toBe(2);
    });
  });
});
