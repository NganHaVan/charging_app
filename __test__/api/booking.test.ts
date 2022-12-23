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
import { addUser1ToDb } from "../../mock/userMock";
import { generateAccessToken } from "../../utils/cookies";
import { addHours, subHours } from "date-fns";

dotenv.config();
process.env.JWT = "test_secret";
const app = createServer();

const later2Hours = addHours(new Date(), 2);
const later4Hours = addHours(new Date(), 4);

describe("Booking API", () => {
  let testProvider1: IProvider;
  let testCharger1: ICharger;
  let testUser1: IUser;
  beforeAll(async () => {
    await starDBConnection();
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
    testProvider1 = await addProvider1ToDb();
    testCharger1 = await addCharger1ToDb(testProvider1);
  });
  describe("/:id/booking", () => {
    describe("POST", () => {
      it("should return 200", async () => {
        const token = generateAccessToken(testUser1, process.env.JWT);

        const startTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(later2Hours).getHours(),
          0
        ).toISOString();
        const endTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(later4Hours).getHours(),
          0
        ).toISOString();

        const { body, statusCode } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/booking`)
          .send({ startTime, endTime })
          .set("Cookie", `access_token=${token}`);

        expect(statusCode).toBe(200);
        expect(body.status).toBe("Success");
        expect(body.detail.bookingHours[0].chargerId._id).toBe(
          testCharger1._id.valueOf()
        );
      });

      it("should return 400 when trying to book time in the past", async () => {
        const token = generateAccessToken(testUser1, process.env.JWT);

        const startTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(subHours(new Date(), 2)).getHours(),
          0
        ).toISOString();
        const endTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(later4Hours).getHours(),
          0
        ).toISOString();

        const { statusCode } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/booking`)
          .send({ startTime, endTime })
          .set("Cookie", `access_token=${token}`);

        expect(statusCode).toBe(400);
      });

      it("should return 403 when a provider trying to book a charger", async () => {
        const token = generateAccessToken(testProvider1, process.env.JWT);

        const startTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(later2Hours).getHours(),
          0
        ).toISOString();
        const endTime = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          new Date(later4Hours).getHours(),
          0
        ).toISOString();

        const { statusCode } = await supertest(app)
          .post(`/api/chargers/${testCharger1._id.valueOf()}/booking`)
          .send({ startTime, endTime })
          .set("Cookie", `access_token=${token}`);

        expect(statusCode).toBe(403);
      });
    });
  });
});
