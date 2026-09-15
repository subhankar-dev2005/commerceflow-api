
import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

import getOrders from "./get-orders.controller.js";
import Order from "./order.model.js";

describe("getOrders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns orders with default pagination", async () => {
    const orders = [
      {
        _id: "507f1f77bcf86cd799439011",
        status: "pending"
      },
      {
        _id: "507f1f77bcf86cd799439012",
        status: "confirmed"
      }
    ];

    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(orders)
    };

    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(2);

    vi.spyOn(Order, "find")
      .mockReturnValue(query);

    const req = {
      query: {},
      user: {
        _id: "507f1f77bcf86cd799439099"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(Order.countDocuments)
      .toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439099"
      });

    expect(Order.find)
      .toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439099"
      });

    expect(query.sort)
      .toHaveBeenCalledWith({
        createdAt: -1
      });

    expect(query.skip)
      .toHaveBeenCalledWith(0);

    expect(query.limit)
      .toHaveBeenCalledWith(10);

    expect(res.status)
      .toHaveBeenCalledWith(200);

    expect(res.json)
      .toHaveBeenCalledWith({
        success: true,
        message: "Orders retrieved successfully",
        data: {
          orders,
          pagination: {
            page: 1,
            limit: 10,
            totalOrders: 2,
            totalPages: 1
          }
        },
        requestId: "test-request-id"
      });

    expect(next)
      .not.toHaveBeenCalled();
  });

  it("filters by status, applies pagination, and sorts ascending", async () => {
    const orders = [
      {
        _id: "507f1f77bcf86cd799439011",
        status: "processing"
      }
    ];

    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(orders)
    };

    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(6);

    vi.spyOn(Order, "find")
      .mockReturnValue(query);

    const req = {
      query: {
        page: "2",
        limit: "5",
        status: "processing",
        sortOrder: "asc"
      },
      user: {
        _id: "507f1f77bcf86cd799439099"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(Order.countDocuments)
      .toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439099",
        status: "processing"
      });

    expect(Order.find)
      .toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439099",
        status: "processing"
      });

    expect(query.sort)
      .toHaveBeenCalledWith({
        createdAt: 1
      });

    expect(query.skip)
      .toHaveBeenCalledWith(5);

    expect(query.limit)
      .toHaveBeenCalledWith(5);

    expect(res.status)
      .toHaveBeenCalledWith(200);

    expect(res.json)
      .toHaveBeenCalledWith({
        success: true,
        message: "Orders retrieved successfully",
        data: {
          orders,
          pagination: {
            page: 2,
            limit: 5,
            totalOrders: 6,
            totalPages: 2
          }
        },
        requestId: "test-request-id"
      });

    expect(next)
      .not.toHaveBeenCalled();
  });

  it("returns an empty order list when the user has no orders", async () => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    };

    vi.spyOn(Order, "countDocuments")
      .mockResolvedValue(0);

    vi.spyOn(Order, "find")
      .mockReturnValue(query);

    const req = {
      query: {},
      user: {
        _id: "507f1f77bcf86cd799439099"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(res.status)
      .toHaveBeenCalledWith(200);

    expect(res.json)
      .toHaveBeenCalledWith({
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

    expect(next)
      .not.toHaveBeenCalled();
  });

  it("passes database errors to the error middleware", async () => {
    const databaseError =
      new Error("Database failure");

    vi.spyOn(Order, "countDocuments")
      .mockRejectedValue(databaseError);

    const req = {
      query: {},
      user: {
        _id: "507f1f77bcf86cd799439099"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await getOrders(req, res, next);

    expect(next)
      .toHaveBeenCalledWith(databaseError);

    expect(res.status)
      .not.toHaveBeenCalled();

    expect(res.json)
      .not.toHaveBeenCalled();
  });
});
