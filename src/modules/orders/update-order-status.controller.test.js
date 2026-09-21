import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

import updateOrderStatus from "./update-order-status.controller.js";
import Order from "./order.model.js";
import Product from "../products/product.model.js";

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue(true);
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
      ["confirmed", "processing"],
      ["confirmed", "cancelled"],
      ["processing", "shipped"],
      ["processing", "cancelled"],
      ["shipped", "delivered"]
    ];

    for (const [currentStatus, nextStatus] of transitions) {
      const order = {
        _id: "507f1f77bcf86cd799439011",
        status: currentStatus,
        items: [],
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

  it("rejects invalid status transitions from confirmed status", async () => {
    const invalidStatuses = ["shipped", "delivered", "pending"];

    for (const targetStatus of invalidStatuses) {
      const order = {
        _id: "507f1f77bcf86cd799439011",
        status: "confirmed",
        save: vi.fn()
      };

      vi.spyOn(Order, "findById").mockResolvedValueOnce(order);

      const req = {
        params: {
          orderId: "507f1f77bcf86cd799439011"
        },
        body: {
          status: targetStatus
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

      expect(order.status).toBe("confirmed");
      expect(order.save).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();

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

  it("handles unknown or undefined order status using fallback without crashing", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "non_existent_status",
      save: vi.fn()
    };

    vi.spyOn(Order, "findById").mockResolvedValueOnce(order);

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

    expect(order.save).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("restores stock for every order item when admin cancellation occurs", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "confirmed",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          quantity: 2
        },
        {
          product: "507f1f77bcf86cd799439014",
          quantity: 5
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);
    vi.spyOn(Product, "findByIdAndUpdate").mockResolvedValue(true);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      body: {
        status: "cancelled"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await updateOrderStatus(req, res, next);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    expect(Product.findByIdAndUpdate).toHaveBeenNthCalledWith(
      1,
      "507f1f77bcf86cd799439013",
      {
        $inc: {
          stock: 2
        }
      }
    );
    expect(Product.findByIdAndUpdate).toHaveBeenNthCalledWith(
      2,
      "507f1f77bcf86cd799439014",
      {
        $inc: {
          stock: 5
        }
      }
    );

    expect(order.status).toBe("cancelled");
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("does not restore stock for non-cancellation transitions", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "confirmed",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          quantity: 2
        }
      ],
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);
    vi.spyOn(Product, "findByIdAndUpdate");

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

    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(order.status).toBe("processing");
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});