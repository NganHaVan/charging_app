import supertest from "supertest";
import dotenv from "dotenv";

import { createServer } from "../../config/server";
import {
  disconnectDBConnection,
  starDBConnection,
  dropDB,
  dropCollections,
} from "../../mock/dbConnectionMock";
import { addProvider1ToDb, addProvider2ToDb } from "../../mock/providerMock";
import { IProvider } from "../../types/Provider";
import { addUser1ToDb } from "../../mock/userMock";
import { generateAccessToken } from "../../utils/cookies";

dotenv.config();
process.env.JWT = "test_secret";
const app = createServer();

describe("provider API", () => {
  let testProvider1: IProvider | null = null;
  let testProvider2: IProvider | null = null;
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
  });

  describe("/", () => {
    describe("GET", () => {
      it("should return 200 without token needed", async () => {
        const { statusCode, body } = await supertest(app).get("/api/providers");

        expect(statusCode).toBe(200);
        expect(Array.isArray(body)).toBe(true);
      });
    });
  });

  describe("/:providerId", () => {
    describe("GET", () => {
      it("should return 200 without token needed", async () => {
        if (testProvider1) {
          const { statusCode, body } = await supertest(app).get(
            `/api/providers/${testProvider1._id.valueOf()}`
          );

          expect(statusCode).toBe(200);
          expect(body._id).toEqual(testProvider1._id.valueOf());
        } else {
          throw new Error("Provider 1 has not been added to db");
        }
      });
    });

    describe("PUT", () => {
      it("should return 200 ONLY with the owner", async () => {
        if (testProvider1) {
          const newPassword = "222222";
          const newCity = "Vantaa";
          const accessToken = generateAccessToken(
            testProvider1,
            process.env.JWT
          );
          const { statusCode, body } = await supertest(app)
            .put(`/api/providers/${testProvider1._id}`)
            .send({ password: newPassword, city: newCity })
            .set("Cookie", [`access_token=${accessToken}`]);
          expect(statusCode).toBe(200);
          expect(body._id).toBe(testProvider1._id.valueOf());
          expect(body.city).toEqual(newCity);
        } else {
          throw new Error("Provider 1 has not been added to db");
        }
      });

      it("should return 401 without access_token", async () => {
        if (testProvider1) {
          const { statusCode } = await supertest(app)
            .put(`/api/providers/${testProvider1._id}`)
            .send({ city: "Vantaa" });
          expect(statusCode).toBe(401);
        } else {
          throw new Error("Provider 1 has not been added to db");
        }
      });

      it("should return 403 if normal user is trying to access", async () => {
        if (testProvider1) {
          const testUser1 = await addUser1ToDb();
          const userAccessToken = generateAccessToken(
            testUser1,
            process.env.JWT
          );
          const { statusCode } = await supertest(app)
            .put(`/api/providers/${testProvider1._id}`)
            .send({ city: "Vantaa" })
            .set("Cookie", [`access_token=${userAccessToken}`]);
          expect(statusCode).toBe(403);
        } else {
          throw new Error("Provider 1 has not been added to db");
        }
      });

      it("should return 403 if other providers who are not the owner are trying to access", async () => {
        if (testProvider1 && testProvider2) {
          const provider2AccessToken = generateAccessToken(
            testProvider2,
            process.env.JWT
          );
          const { statusCode, body } = await supertest(app)
            .put(`/api/providers/${testProvider1._id}`)
            .send({ city: "Vantaa" })
            .set("Cookie", [`access_token=${provider2AccessToken}`]);
          expect(statusCode).toBe(403);
        } else {
          throw new Error("Provider 1 or Provider 2 has not been added to db");
        }
      });
    });

    describe("DELETE", () => {
      it("should return 200 ONLY with the owner", async () => {
        if (testProvider1) {
          const accessToken = generateAccessToken(
            testProvider1,
            process.env.JWT
          );
          const { statusCode } = await supertest(app)
            .delete(`/api/providers/${testProvider1._id}`)
            .set("Cookie", [`access_token=${accessToken}`]);
          expect(statusCode).toBe(200);
        } else {
          throw new Error("Provider 1 has not been added to db");
        }
      });
    });

    it("should return 401 without access_token", async () => {
      if (testProvider1) {
        const { statusCode } = await supertest(app).delete(
          `/api/providers/${testProvider1._id}`
        );
        expect(statusCode).toBe(401);
      } else {
        throw new Error("Provider 1 has not been added to db");
      }
    });

    it("should return 403 with normal user", async () => {
      if (testProvider1) {
        const testUser1 = await addUser1ToDb();
        const userAccessToken = generateAccessToken(testUser1, process.env.JWT);
        const { statusCode } = await supertest(app)
          .delete(`/api/providers/${testProvider1._id}`)
          .set("Cookie", [`access_token=${userAccessToken}`]);
        expect(statusCode).toBe(403);
      } else {
        throw new Error("Provider 1 has not been added to db");
      }
    });

    it("should return 403 with not the owner", async () => {
      if (testProvider1 && testProvider2) {
        const provider2AccessToken = generateAccessToken(
          testProvider2,
          process.env.JWT
        );
        const { statusCode } = await supertest(app)
          .delete(`/api/providers/${testProvider1._id}`)
          .set("Cookie", [`access_token=${provider2AccessToken}`]);
        expect(statusCode).toBe(403);
      } else {
        throw new Error("Provider 1 and Provider 2 has not been added to db");
      }
    });
  });
});
