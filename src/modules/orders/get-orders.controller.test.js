import { describe, it, expect, beforeEach, vi } from "vitest";

import getOrders from "./get-orders.controller.js";
import Order from "./order.model.js";

describe("getOrders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the user's orders with default pagination", async () => {
    const orders = [
      {
        _id: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
        status: "pending"
      }
    ];

    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(1);

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(orders)
    };

    vi.spyOn(Order, "find")
      .mockReturnValue(findQuery);

    const req = {
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      query: {},
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(Order.countDocuments).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012"
    });

    expect(Order.find).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012"
    });

    expect(findQuery.sort).toHaveBeenCalledWith({
      createdAt: -1
    });

    expect(findQuery.skip).toHaveBeenCalledWith(0);
    expect(findQuery.limit).toHaveBeenCalledWith(10);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        pagination: {
          page: 1,
          limit: 10,
          totalOrders: 1,
          totalPages: 1
        }
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });
});
  it("applies status filter, pagination, and ascending sort", async () => {
    const orders = [
      {
        _id: "507f1f77bcf86cd799439013",
        user: "507f1f77bcf86cd799439012",
        status: "processing"
      }
    ];

    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(25);

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(orders)
    };

    vi.spyOn(Order, "find")
      .mockReturnValue(findQuery);

    const req = {
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      query: {
        page: "2",
        limit: "10",
        status: "processing",
        sortOrder: "asc"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(Order.countDocuments).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012",
      status: "processing"
    });

    expect(Order.find).toHaveBeenCalledWith({
      user: "507f1f77bcf86cd799439012",
      status: "processing"
    });

    expect(findQuery.sort).toHaveBeenCalledWith({
      createdAt: 1
    });

    expect(findQuery.skip).toHaveBeenCalledWith(10);
    expect(findQuery.limit).toHaveBeenCalledWith(10);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        pagination: {
          page: 2,
          limit: 10,
          totalOrders: 25,
          totalPages: 3
        }
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });
    it("returns an empty order list when the user has no orders", async () => {
    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(0);

    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    };

    vi.spyOn(Order, "find")
      .mockReturnValue(findQuery);

    const req = {
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      query: {},
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders: [],
        pagination: {
          page: 1,
          limit: 10,
          totalOrders: 0,
          totalPages: 1
        }
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });
    it("passes database errors to the error middleware", async () => {
    const databaseError = new Error("Database failure");

    vi.spyOn(Order, "countDocuments")
      .mockRejectedValue(databaseError);

    const req = {
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      query: {},
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(next).toHaveBeenCalledWith(databaseError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });