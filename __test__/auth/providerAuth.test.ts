import supertest from "supertest";
import {
  disconnectDBConnection,
  starDBConnection,
  dropDB,
  dropCollections,
} from "../../mock/dbConnectionMock";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createServer } from "../../config/server";
import {
  addProvider1ToDb,
  Provider1,
  Provider2,
} from "../../mock/providerMock";
import { getTokenFromCookie } from "../../utils/cookies";
import { IProvider } from "../../types/Provider";

dotenv.config();
process.env.JWT = "test_secret";
const app = createServer();

describe("Provider Auth", () => {
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

  const { companyName, password, address, city, country } = Provider1;

  describe("provider register", () => {
    it("should return 200 and user info", async () => {
      const { body, statusCode } = await supertest(app)
        .post("/api/providers/register")
        .send({
          companyName,
          password,
          address,
          city,
          country,
        });

      expect(statusCode).toBe(200);
      expect(body.companyName).toBe(Provider1.companyName);
      expect(body.isAdmin).toBe(true);
      expect(typeof body._id).toBe("string");
    });

    it("should return 500 due to validation error", async () => {
      const { body, statusCode } = await supertest(app)
        .post("/api/providers/register")
        .send({ address, city, country });

      expect(statusCode).toBe(500);
    });

    it("should return 400 when registering existed provider", async () => {
      return supertest(app)
        .post("/api/providers/register")
        .send({
          companyName,
          password,
          address,
          city,
          country,
        })
        .then(() => {
          return supertest(app)
            .post("/api/providers/register")
            .send({
              companyName,
              password,
              address,
              city,
              country,
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.message).toMatch(/This provider already exists/);
            });
        });
    });
  });

  describe("provider login", () => {
    let testProvider1: IProvider | null = null;
    beforeEach(async () => {
      testProvider1 = await addProvider1ToDb();
    });

    it("should return 200 with cookie access_token", async () => {
      const { statusCode, headers } = await supertest(app)
        .post("/api/providers/login")
        .send({
          companyName,
          password,
        });
      expect(statusCode).toBe(200);
      const cookies = headers["set-cookie"];
      if (testProvider1 && cookies) {
        const token = jwt.sign(
          {
            _id: testProvider1._id,
            isAdmin: testProvider1.isAdmin,
          },
          process.env.JWT ?? ""
        );
        expect(getTokenFromCookie(cookies)).toBe(token);
      } else {
        console.error("Cookies are not right");
        throw new Error("Cookies are not right");
      }
    });

    it("should return 404 for unregistered provider", async () => {
      const { companyName: companyName2, password: password2 } = Provider2;
      const { statusCode } = await supertest(app)
        .post("/api/providers/login")
        .send({
          companyName: companyName2,
          password: password2,
        });
      expect(statusCode).toBe(404);
    });

    it("should return 400 for wrong company name and password", async () => {
      const { statusCode } = await supertest(app)
        .post("/api/providers/login")
        .send({
          companyName: Provider1.companyName,
          password: "wrong_password",
        });
      expect(statusCode).toBe(400);
    });
  });
});
