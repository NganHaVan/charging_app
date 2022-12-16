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
import { addProvider1ToDb, addProvider2ToDb } from "../../mock/providerMock";
import { addCharger1ToDb, addCharger2ToDb } from "../../mock/chargerMock";
import { generateAccessToken } from "../../utils/cookies";
import { addUser1ToDb } from "../../mock/userMock";

dotenv.config();
process.env.JWT = "test_secret";
const app = createServer();

describe("Charger API", () => {
  let testProvider1: IProvider;
  let testProvider2: IProvider;
  let testCharger1: ICharger;
  let testCharger2: ICharger;
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
    testProvider1 = await addProvider1ToDb();
    testProvider2 = await addProvider2ToDb();
    testCharger1 = await addCharger1ToDb(testProvider1);
    testCharger2 = await addCharger2ToDb(testProvider2);
  });

  describe("/", () => {
    describe("GET", () => {
      it("should return 200 without token needed", async () => {
        const { statusCode, body } = await supertest(app).get("/api/chargers");

        expect(statusCode).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(2);
      });
    });

    describe("POST", () => {
      it("should return 200 for provider token", async () => {
        const token = generateAccessToken(testProvider1, process.env.JWT);
        const { statusCode, body } = await supertest(app)
          .post("/api/chargers")
          .send({
            chargerName: "Test Charger",
            location: "Building C, Helsinki, Finland",
            pricePerHour: 40,
          })
          .set("Cookie", [`access_token=${token}`]);
        expect(statusCode).toBe(200);
        expect(body.chargerName).toBe("Test Charger");
        expect(body.companyId).toBe(testProvider1._id.valueOf());
      });

      it("should return 403 for normal user", async () => {
        const user1 = await addUser1ToDb();
        const token = generateAccessToken(user1, process.env.JWT);
        const { statusCode, body } = await supertest(app)
          .post("/api/chargers")
          .send({
            chargerName: "Test Charger",
            location: "Building C, Helsinki, Finland",
            pricePerHour: 40,
          })
          .set("Cookie", [`access_token=${token}`]);
        expect(statusCode).toBe(403);
      });

      it("should return 401 with no access_token", async () => {
        const { statusCode, body } = await supertest(app)
          .post("/api/chargers")
          .send({
            chargerName: "Test Charger",
            location: "Building C, Helsinki, Finland",
            pricePerHour: 40,
          });
        expect(statusCode).toBe(401);
      });
    });
  });

  describe("/:chargerId", () => {
    describe("GET", () => {
      it("should return 200", async () => {
        const { statusCode, body } = await supertest(app).get(
          `/api/chargers/${testCharger1._id.valueOf()}`
        );

        expect(statusCode).toBe(200);
        expect(body._id).toBe(testCharger1._id.valueOf());
      });
    });
    describe("PUT", () => {
      it("should return 200 for the charger's owner", async () => {
        const token = generateAccessToken(testProvider1, process.env.JWT);
        const newLocation = "New location";
        const newPrice = 80;
        const { statusCode, body } = await supertest(app)
          .put(`/api/chargers/${testCharger1._id.valueOf()}`)
          .send({
            location: newLocation,
            pricePerHour: newPrice,
          })
          .set("Cookie", `access_token=${token}`);

        expect(statusCode).toBe(200);
        expect(body.chargerName).toBe(testCharger1.chargerName);
        expect(body.location).toBe(newLocation);
        expect(body.pricePerHour).toBe(newPrice);
      });

      it("should return 403 for not the charger's owner", async () => {
        const token = generateAccessToken(testProvider2, process.env.JWT);
        const { statusCode } = await supertest(app)
          .put(`/api/chargers/${testCharger1._id.valueOf()}`)
          .send({
            location: "Test location",
          })
          .set("Cookie", `access_token=${token}`);
        expect(statusCode).toBe(403);
      });

      it("should return 403 for normal user", async () => {
        const user = await addUser1ToDb();
        const token = generateAccessToken(user, process.env.JWT);
        const { statusCode } = await supertest(app)
          .put(`/api/chargers/${testCharger1._id.valueOf()}`)
          .send({
            location: "Test location",
          })
          .set("Cookie", `access_token=${token}`);
        expect(statusCode).toBe(403);
      });

      it("should return 401 without token", async () => {
        const { statusCode } = await supertest(app)
          .put(`/api/chargers/${testCharger1._id.valueOf()}`)
          .send({
            location: "Test location",
          });
        expect(statusCode).toBe(401);
      });

      it("should return 400 if updating existing charger name", async () => {
        const token = generateAccessToken(testProvider1, process.env.JWT);
        const newPrice = 80;
        const { statusCode, body } = await supertest(app)
          .put(`/api/chargers/${testCharger1._id.valueOf()}`)
          .send({
            pricePerHour: newPrice,
            chargerName: testCharger1.chargerName,
          })
          .set("Cookie", `access_token=${token}`);
        expect(statusCode).toBe(400);
      });
    });

    describe("DELETE", () => {
      it("should return 200 for the charger's owner", async () => {
        const token = generateAccessToken(testProvider1, process.env.JWT);

        const { statusCode, body } = await supertest(app)
          .delete(`/api/chargers/${testCharger1._id.valueOf()}`)
          .set("Cookie", `access_token=${token}`);
        console.log({ body });
        expect(statusCode).toBe(200);
      });

      it("should return 403 for people who are not the charger's owner", async () => {
        const token = generateAccessToken(testProvider2, process.env.JWT);

        const { statusCode } = await supertest(app)
          .delete(`/api/chargers/${testCharger1._id.valueOf()}`)
          .set("Cookie", `access_token=${token}`);
        expect(statusCode).toBe(403);
      });

      it("should return 403 for normal users", async () => {
        const user = await addUser1ToDb();
        const token = generateAccessToken(user, process.env.JWT);

        const { statusCode } = await supertest(app)
          .delete(`/api/chargers/${testCharger1._id.valueOf()}`)
          .set("Cookie", `access_token=${token}`);
        expect(statusCode).toBe(403);
      });

      it("should return 401 without access_token", async () => {
        const { statusCode } = await supertest(app).delete(
          `/api/chargers/${testCharger1._id.valueOf()}`
        );
        expect(statusCode).toBe(401);
      });
    });
  });
});
