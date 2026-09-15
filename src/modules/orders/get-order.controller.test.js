import { describe, it, expect, beforeEach, vi } from "vitest";

import getOrder from "./get-order.controller.js";
import Order from "./order.model.js";

describe("getOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the order when the user owns it", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      items: []
    };

    const populate = vi.fn().mockResolvedValue(order);

    vi.spyOn(Order, "findById")
      .mockReturnValue({
        populate
      });

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );

    expect(populate).toHaveBeenCalledWith(
      "items.product",
      "name price image category"
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order retrieved successfully",
      data: {
        order
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });
});
  it("passes ORDER_NOT_FOUND to the error middleware when the order does not exist", async () => {
    const populate = vi.fn().mockResolvedValue(null);

    vi.spyOn(Order, "findById")
      .mockReturnValue({
        populate
      });

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error).toMatchObject({
      statusCode: 404,
      code: "ORDER_NOT_FOUND"
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
    it("rejects access when the order belongs to another user", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439013",
      items: []
    };

    const populate = vi.fn().mockResolvedValue(order);

    vi.spyOn(Order, "findById")
      .mockReturnValue({
        populate
      });

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error).toMatchObject({
      statusCode: 403,
      code: "ORDER_ACCESS_DENIED"
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
    it("passes database errors to the error middleware", async () => {
    const databaseError = new Error("Database failure");

    const populate = vi.fn()
      .mockRejectedValue(databaseError);

    vi.spyOn(Order, "findById")
      .mockReturnValue({
        populate
      });

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrder(req, res, next);

    expect(next).toHaveBeenCalledWith(databaseError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });