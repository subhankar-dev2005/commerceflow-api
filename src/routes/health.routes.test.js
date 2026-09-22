import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import { createApp } from "../app.js";
import * as mongodb from "../database/mongodb.js";

describe("Health Routes", () => {
  let app;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  describe("GET /api/v1/health", () => {
    it("returns HTTP 200 with status ok and requestId", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.status).toBe("ok");
      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe("string");
      expect(response.body.requestId.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/health/live", () => {
    it("returns HTTP 200 with status alive and requestId", async () => {
      const response = await request(app).get("/api/v1/health/live");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.status).toBe("alive");
      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe("string");
      expect(response.body.requestId.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/health/ready", () => {
    it("returns HTTP 200 with status ready when MongoDB is connected", async () => {
      vi.spyOn(mongodb, "getMongoDBStatus").mockReturnValue({
        status: "connected",
        readyState: 1
      });

      const response = await request(app).get("/api/v1/health/ready");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.status).toBe("ready");
    });

    it("returns HTTP 503 with status not_ready when MongoDB is disconnected", async () => {
      vi.spyOn(mongodb, "getMongoDBStatus").mockReturnValue({
        status: "disconnected",
        readyState: 0
      });

      const response = await request(app).get("/api/v1/health/ready");

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data?.status).toBe("not_ready");
    });
  });
});
