import { describe, it, expect, beforeEach, vi } from "vitest";

import updateOrderStatus from "./update-order-status.controller.js";
import Order from "./order.model.js";

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 404 when order does not exist", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue(null);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      body: {
        status: "processing"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await updateOrderStatus(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: "ORDER_NOT_FOUND"
      })
    );

    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an invalid order status transition", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending"
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      body: {
        status: "shipped"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await updateOrderStatus(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: "INVALID_ORDER_STATUS_TRANSITION"
      })
    );

    expect(order.status).toBe("pending");
    expect(res.status).not.toHaveBeenCalled();
  });
});
  it("updates the order status when the transition is valid", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending",
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      body: {
        status: "processing"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await updateOrderStatus(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );

    expect(order.status).toBe("processing");

    expect(order.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order status updated successfully",
      data: {
        order
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });
    it("allows all valid status transitions", async () => {
    const transitions = [
      ["pending", "processing"],
      ["pending", "cancelled"],
      ["processing", "shipped"],
      ["processing", "cancelled"],
      ["shipped", "delivered"]
    ];

    for (const [currentStatus, nextStatus] of transitions) {
      const order = {
        _id: "507f1f77bcf86cd799439011",
        status: currentStatus,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Order, "findById")
        .mockResolvedValueOnce(order);

      const req = {
        params: {
          orderId: "507f1f77bcf86cd799439011"
        },
        body: {
          status: nextStatus
        },
        requestId: "test-request-id"
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      const next = vi.fn();

      await updateOrderStatus(req, res, next);

      expect(order.status).toBe(nextStatus);
      expect(order.save).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    }
  });
    it("rejects transitions from delivered and cancelled orders", async () => {
    const terminalStatuses = [
      "delivered",
      "cancelled"
    ];

    for (const currentStatus of terminalStatuses) {
      const order = {
        _id: "507f1f77bcf86cd799439011",
        status: currentStatus,
        save: vi.fn()
      };

      vi.spyOn(Order, "findById")
        .mockResolvedValueOnce(order);

      const req = {
        params: {
          orderId: "507f1f77bcf86cd799439011"
        },
        body: {
          status: "processing"
        },
        requestId: "test-request-id"
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      const next = vi.fn();

      await updateOrderStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          code: "INVALID_ORDER_STATUS_TRANSITION"
        })
      );

      expect(order.status).toBe(currentStatus);
      expect(order.save).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    }
  });