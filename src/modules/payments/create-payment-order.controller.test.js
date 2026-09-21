
import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

import createPaymentOrder from "./create-payment-order.controller.js";
import Order from "../orders/order.model.js";
import razorpay from "./razorpay.service.js";

describe("createPaymentOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a Razorpay order successfully", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      subtotal: 499,
      status: "pending",
      payment: {
        status: "pending",
        razorpayOrderId: ""
      },
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.orders, "create")
      .mockResolvedValue({
        id: "order_TEST123",
        amount: 49900,
        currency: "INR"
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

    await createPaymentOrder(req, res, next);

    expect(Order.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    });

    expect(razorpay.orders.create).toHaveBeenCalledWith({
      amount: 49900,
      currency: "INR",
      receipt: "507f1f77bcf86cd799439011"
    });

    expect(order.payment.razorpayOrderId)
      .toBe("order_TEST123");

    expect(order.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Payment order created successfully",
      data: {
        razorpayOrderId: "order_TEST123",
        amount: 49900,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID
      },
      requestId: "test-request-id"
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns ORDER_NOT_FOUND when the order does not exist", async () => {
    vi.spyOn(Order, "findOne")
      .mockResolvedValue(null);

    vi.spyOn(razorpay.orders, "create");

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

    await createPaymentOrder(req, res, next);

    expect(Order.findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012"
    });

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("ORDER_NOT_FOUND");
    expect(error.message).toBe("Order not found");
    expect(error.errors).toEqual([]);

    expect(res.status).not.toHaveBeenCalled();
    expect(razorpay.orders.create)
      .not.toHaveBeenCalled();
  });

  it("returns ORDER_CANCELLED when the order is cancelled", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      subtotal: 499,
      status: "cancelled",
      payment: {
        status: "pending",
        razorpayOrderId: ""
      }
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.orders, "create");

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

    await createPaymentOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("ORDER_CANCELLED");
    expect(error.message).toBe("Cannot create payment for a cancelled order");
    expect(error.errors).toEqual([]);

    expect(res.status).not.toHaveBeenCalled();
    expect(razorpay.orders.create)
      .not.toHaveBeenCalled();
  });

  it("returns ORDER_ALREADY_PAID when the order is already paid", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      subtotal: 499,
      status: "confirmed",
      payment: {
        status: "paid",
        razorpayOrderId: ""
      }
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.orders, "create");

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

    await createPaymentOrder(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("ORDER_ALREADY_PAID");
    expect(error.message).toBe("Order has already been paid");
    expect(error.errors).toEqual([]);

    expect(res.status).not.toHaveBeenCalled();
    expect(razorpay.orders.create)
      .not.toHaveBeenCalled();
  });

  it("returns the existing Razorpay order when one already exists", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      subtotal: 499,
      status: "pending",
      payment: {
        status: "pending",
        razorpayOrderId: "order_existing123"
      }
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.orders, "create");

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

    await createPaymentOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Payment order already exists",
      data: {
        razorpayOrderId: "order_existing123",
        amount: 49900,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID
      },
      requestId: "test-request-id"
    });

    expect(razorpay.orders.create)
      .not.toHaveBeenCalled();

    expect(next).not.toHaveBeenCalled();
  });

  it("passes Razorpay API errors to next", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      subtotal: 499,
      status: "pending",
      payment: {
        status: "pending",
        razorpayOrderId: ""
      }
    };

    const razorpayError = new Error(
      "Razorpay API failed"
    );

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.orders, "create")
      .mockRejectedValue(razorpayError);

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

    await createPaymentOrder(req, res, next);

    expect(next).toHaveBeenCalledWith(
      razorpayError
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
