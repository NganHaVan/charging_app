import supertest from "supertest";
import { createServer } from "../../config/server";
import {
  disconnectDBConnection,
  starDBConnection,
} from "../../mock/dbConnectionMock";

const app = createServer();

describe("provider API", () => {
  beforeAll(async () => {
    await starDBConnection();
  });
  afterAll(async () => {
    await disconnectDBConnection();
  });
  describe("GET provider", () => {
    describe("no need to login", () => {
      it("should return 200", async () => {
        const { statusCode, body } = await supertest(app).get("/api/providers");

        expect(statusCode).toBe(200);
        expect(Array.isArray(body)).toBe(true);
      });
    });
  });
});
