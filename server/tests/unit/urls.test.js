import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../index.js";

let mongoServer;

describe("URL Shortening API", () => {
  beforeAll(async () => {
    // in memory mongodb server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // testing clean the db before each test
  // beforeEach(async () => {
  //   await mongoose.connection.db.dropDatabase();
  // });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("POST /api/shorten", () => {
    it("should return a shortened url and qrcode for a valid url", async () => {
      const response = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.ai" })
        .expect(200);

      expect(response.body).toHaveProperty("shortUrl");
      expect(response.body).toHaveProperty("qrCode");
      expect(response.body.shortUrl).toContain(process.env.BASE_URL);
    });

    it("should return 400 for an invalid url returned", async () => {
      const response = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "not-a-valid-url" })
        .expect(400);

      expect(response.body).toHaveProperty("error", "invalid url");
    });
  });
});
