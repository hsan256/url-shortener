import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../index.js";
import Url from "../../models/Url.js";

describe("e2e api tests for url shortener", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Url.deleteMany({});
  });

  describe("GET /api", () => {
    it("should return an empty array initially", async () => {
      const res = await request(app).get("/api");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/shorten", () => {
    it("should return 400 for an invalid URL", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "not a url" });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid URL");
    });

    it("should create a shortened URL for a valid URL", async () => {
      const res = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("shortUrl");
      expect(res.body).toHaveProperty("qrCode");
    });
  });

  describe("GET /api/:shortId", () => {
    it("should return 404 for a non-existent shortId", async () => {
      const res = await request(app).get("/api/nonexistent");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("URL not found");
    });

    it("should return the original URL for an existing shortId", async () => {
      const postRes = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      expect(postRes.statusCode).toBe(200);
      const shortUrl = postRes.body.shortUrl;
      const shortId = shortUrl.split("/").pop();

      const getRes = await request(app).get(`/api/${shortId}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toHaveProperty("originalUrl", "https://www.arcube.org");
    });
  });

  describe("PUT /api/:shortId", () => {
    it("should return 400 if the new shortId is invalid", async () => {
      const postRes = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      const shortId = postRes.body.shortUrl.split("/").pop();

      const res = await request(app)
        .put(`/api/${shortId}`)
        .send({ shortId: "abc" }); // invalid less than 4 characters
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Short ID must be at least 4 characters");
    });

    it("should update the shortId when valid data is provided", async () => {
      const postRes = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      const originalShortId = postRes.body.shortUrl.split("/").pop();

      const newShortId = "customid";
      const putRes = await request(app)
        .put(`/api/${originalShortId}`)
        .send({ shortId: newShortId });
      expect(putRes.statusCode).toBe(200);
      expect(putRes.body.shortId).toBe(newShortId);

      const getRes = await request(app).get(`/api/${newShortId}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.originalUrl).toBe("https://www.arcube.org");
    });

    it("should return 400 if the custom URL is already taken", async () => {
      // create a url and update it with a custom shortId
      const postRes1 = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      const shortId1 = postRes1.body.shortUrl.split("/").pop();
      const newShortId = "customid";
      await request(app).put(`/api/${shortId1}`).send({ shortId: newShortId });

      // create another URL
      const postRes2 = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://another.com" });
      const shortId2 = postRes2.body.shortUrl.split("/").pop();

      const putRes = await request(app)
        .put(`/api/${shortId2}`)
        .send({ shortId: newShortId });
      expect(putRes.statusCode).toBe(400);
      expect(putRes.body.error).toBe("This custom URL is already taken");
    });

    it("should return 404 if URL not found for update", async () => {
      const res = await request(app)
        .put("/api/nonexistent")
        .send({ shortId: "customid" });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("URL not found");
    });
  });

  describe("DELETE /api/:shortId", () => {
    it("should return 404 if URL not found", async () => {
      const res = await request(app).delete("/api/nonexistent");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("URL not found");
    });

    it("should delete the url successfully", async () => {
      const postRes = await request(app)
        .post("/api/shorten")
        .send({ originalUrl: "https://www.arcube.org" });
      const shortId = postRes.body.shortUrl.split("/").pop();

      const deleteRes = await request(app).delete(`/api/${shortId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe("URL deleted successfully");

      // verify deletion by attempting to get the url
      const getRes = await request(app).get(`/api/${shortId}`);
      expect(getRes.statusCode).toBe(404);
      expect(getRes.body.error).toBe("URL not found");
    });
  });
});
