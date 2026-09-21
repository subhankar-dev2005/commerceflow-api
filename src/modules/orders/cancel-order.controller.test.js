
import {
  describe,
  it,
  expect,
  vi,
  beforeEach
} from "vitest";

import Order from "./order.model.js";
import Product from "../products/product.model.js";

import cancelOrder from "./cancel-order.controller.js";

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(Product, "findByIdAndUpdate");
  });

  it("should return ORDER_NOT_FOUND when the order does not exist", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue(null);

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

    await cancelOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("ORDER_NOT_FOUND");
    expect(error.message).toBe("Order not found");

    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return ORDER_ACCESS_DENIED when the user does not own the order", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439013",
      status: "pending",
      items: []
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

    await cancelOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("ORDER_ACCESS_DENIED");
    expect(error.message).toBe(
      "You are not allowed to cancel this order"
    );

    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return ORDER_CANNOT_BE_CANCELLED for a delivered order", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "delivered",
      items: []
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

    await cancelOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(
      "ORDER_CANNOT_BE_CANCELLED"
    );
    expect(error.message).toBe(
      "Delivered orders cannot be cancelled"
    );

    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return ORDER_ALREADY_CANCELLED when the order is already cancelled", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "cancelled",
      items: []
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

    await cancelOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(
      "ORDER_ALREADY_CANCELLED"
    );
    expect(error.message).toBe(
      "Order is already cancelled"
    );

    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should cancel the order atomically, restore stock, and return the updated order", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "pending",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          quantity: 2
        },
        {
          product: "507f1f77bcf86cd799439014",
          quantity: 3
        }
      ]
    };

    const updatedOrder = {
      ...order,
      status: "cancelled"
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);
    vi.spyOn(Order, "findOneAndUpdate").mockResolvedValue(updatedOrder);

    Product.findByIdAndUpdate
      .mockResolvedValueOnce({
        _id: "507f1f77bcf86cd799439013",
        stock: 12
      })
      .mockResolvedValueOnce({
        _id: "507f1f77bcf86cd799439014",
        stock: 8
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

    await cancelOrder(req, res, next);

    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
        status: { $nin: ["delivered", "cancelled"] }
      },
      {
        $set: {
          status: "cancelled"
        }
      },
      {
        new: true
      }
    );

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
          stock: 3
        }
      }
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: updatedOrder
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should return ORDER_ALREADY_CANCELLED and not restore stock when a concurrent request cancels first", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "pending",
      items: [
        {
          product: "507f1f77bcf86cd799439013",
          quantity: 2
        }
      ]
    };

    vi.spyOn(Order, "findById").mockResolvedValue(order);
    vi.spyOn(Order, "findOneAndUpdate").mockResolvedValue(null);

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

    await cancelOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(
      "ORDER_ALREADY_CANCELLED"
    );
    expect(error.message).toBe(
      "Order is already cancelled"
    );

    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
