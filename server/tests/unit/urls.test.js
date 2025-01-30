import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import app from "../../index.js";
import Url from "../../models/Url.js";

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

      expect(response.body).toHaveProperty("error", "Invalid URL");
    });
  });

  describe("GET /api/:shortId", () => {
    it("should redirect to the original URL if shortId exists", async () => {
      const testUrl = await Url.create({
        originalUrl: "https://www.arcube.ai",
        shortId: "test1234",
        qrCode: "data:image/png;base64,...",
      });

      const response = await request(app)
        .get(`/api/${testUrl.shortId}`)
        .expect(302);

      expect(response.headers.location).toBe("https://www.arcube.ai");
    });

    it("should return 404 if the shortId does not exist", async () => {
      const response = await request(app).get("/api/notexist").expect(404);
      expect(response.body).toHaveProperty("error", "URL not found");
    });
  });
});

describe("Url Model Unit Tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await Url.syncIndexes();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Url.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("should create a valid Url document", async () => {
    const validDoc = new Url({
      originalUrl: "https://www.arcube.org",
      shortId: "abcd1234",
    });
    const savedDoc = await validDoc.save();

    expect(savedDoc._id).toBeDefined();
    expect(savedDoc.originalUrl).toBe("https://www.arcube.org");
    expect(savedDoc.shortId).toBe("abcd1234");
    expect(savedDoc.clicks).toBe(0);
  });

  it("should fail if shortId is not unique", async () => {
    await Url.create({
      originalUrl: "https://www.arcube.org",
      shortId: "uniqueID",
    });

    await expect(
      Url.create({
        originalUrl: "https://www.arcube.org",
        shortId: "uniqueID",
      })
    ).rejects.toThrow(/duplicate key error/i);
  });
});
