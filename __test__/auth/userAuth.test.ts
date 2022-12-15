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
import { getTokenFromCookie } from "../../utils/cookies";
import { IProvider } from "../../types/Provider";
import { addUser1ToDb, User1, User2 } from "../../mock/userMock";
import { IUser } from "../../types/User";

dotenv.config();
process.env.JWT = "test_secret";
const app = createServer();

describe("User Auth", () => {
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

  describe("user register", () => {
    const { email, password, phoneNumber, username } = User1;
    it("should return 200 and user info", async () => {
      const { body, statusCode } = await supertest(app)
        .post("/api/users/register")
        .send({
          email,
          password,
          phoneNumber,
          username,
        });

      expect(statusCode).toBe(200);
      expect(body.phoneNumber).toBe(User1.phoneNumber);
      expect(body.isAdmin).toBe(false);
      expect(typeof body._id).toBe("string");
    });

    it("should return 500 due to validation error", async () => {
      const { body, statusCode } = await supertest(app)
        .post("/api/users/register")
        .send({ phoneNumber, username });

      expect(statusCode).toBe(500);
    });

    it("should return 400 when registering existed user", async () => {
      await supertest(app).post("/api/users/register").send({
        email,
        password,
        phoneNumber,
        username,
      });
      const { body, statusCode } = await supertest(app)
        .post("/api/users/register")
        .send({
          email,
          password,
          phoneNumber,
          username,
        });

      expect(statusCode).toBe(400);
      expect(body.message).toMatch(/This phone number already exists/);
    });
  });

  describe("user login", () => {
    let testUser1: IUser | null = null;
    const { email, password, phoneNumber, username } = User1;

    beforeEach(async () => {
      testUser1 = await addUser1ToDb();
    });

    it("should return 200 with cookie access_token", async () => {
      const { statusCode, headers, body } = await supertest(app)
        .post("/api/users/login")
        .send({
          phoneNumber,
          password,
        });
      expect(statusCode).toBe(200);
      const cookies = headers["set-cookie"];
      if (testUser1 && cookies) {
        const token = jwt.sign(
          {
            _id: testUser1._id,
            isAdmin: testUser1.isAdmin,
          },
          process.env.JWT ?? ""
        );
        expect(getTokenFromCookie(cookies)).toBe(token);
      } else {
        console.error("Cookies are not right");
        throw new Error("Cookies are not right");
      }
    });

    it("should return 404 for unregistered user", async () => {
      const { statusCode } = await supertest(app)
        .post("/api/users/login")
        .send({
          phoneNumber: User2.phoneNumber,
          password: User2.password,
        });
      expect(statusCode).toBe(404);
    });

    it("should return 400 for wrong phone number or password", async () => {
      const { statusCode } = await supertest(app)
        .post("/api/users/login")
        .send({
          phoneNumber,
          password: "wrong_password",
        });
      expect(statusCode).toBe(400);
    });
  });
});
