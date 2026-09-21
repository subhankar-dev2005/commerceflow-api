import { describe, it, expect, vi } from "vitest";
import { getOrdersSchema } from "./order.validator.js";
import validate from "../../common/middleware/validate.middleware.js";

describe("getOrdersSchema & validation boundary", () => {
  it("1. accepts a valid request with no query parameters and applies defaults", () => {
    const result = getOrdersSchema.safeParse({
      query: {}
    });

    expect(result.success).toBe(true);
    expect(result.data.query.page).toBe(1);
    expect(result.data.query.limit).toBe(10);
    expect(result.data.query.sortOrder).toBe("desc");
    expect(result.data.query.status).toBeUndefined();
  });

  it("2. accepts all valid supported order statuses", () => {
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    for (const status of validStatuses) {
      const result = getOrdersSchema.safeParse({
        query: { status }
      });
      expect(result.success).toBe(true);
      expect(result.data.query.status).toBe(status);
    }
  });

  it("3. rejects invalid order status", () => {
    const result = getOrdersSchema.safeParse({
      query: { status: "unknown_status" }
    });

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((i) => i.path.includes("status"))
    ).toBe(true);
  });

  it("4. rejects invalid/non-positive page values", () => {
    const invalidPages = [0, -1, -10, "abc", 1.5];

    for (const page of invalidPages) {
      const result = getOrdersSchema.safeParse({
        query: { page }
      });
      expect(result.success).toBe(false);
      expect(
        result.error.issues.some((i) => i.path.includes("page"))
      ).toBe(true);
    }
  });

  it("5. rejects invalid/non-positive limit values and limit > 100", () => {
    const invalidLimits = [0, -5, 101, "xyz", 10.5];

    for (const limit of invalidLimits) {
      const result = getOrdersSchema.safeParse({
        query: { limit }
      });
      expect(result.success).toBe(false);
      expect(
        result.error.issues.some((i) => i.path.includes("limit"))
      ).toBe(true);
    }
  });

  it("verifies invalid input is rejected at the validation boundary and does not reach the controller", () => {
    const middleware = validate(getOrdersSchema);

    const req = {
      body: {},
      query: { status: "invalid_status", page: -1 },
      params: {}
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "query.status" }),
        expect.objectContaining({ field: "query.page" })
      ])
    );
  });

  it("verifies valid input passes through the validation boundary and populates req.query", () => {
    const middleware = validate(getOrdersSchema);

    const req = {
      body: {},
      query: { status: "processing", page: "2", limit: "25" },
      params: {}
    };
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toBe(2);
    expect(req.query.limit).toBe(25);
    expect(req.query.status).toBe("processing");
    expect(req.query.sortOrder).toBe("desc");
  });
});
