import {
  describe,
  it,
  expect,
  vi,
  beforeEach
} from "vitest";

import crypto from "crypto";

import Order from "../orders/order.model.js";

import verifyPayment from "./verify-payment.controller.js";

describe("verifyPayment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 404 when the order does not exist", async () => {
    vi.spyOn(Order, "findOne").mockResolvedValue(null);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      body: {},
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

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "ORDER_NOT_FOUND"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should return success when payment is already verified", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "confirmed",
      payment: {
        status: "paid",
        transactionId: "pay_test123"
      }
    };

    vi.spyOn(Order, "findOne").mockResolvedValue(order);

    const req = {
      params: {
        orderId: order._id
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_test123",
        razorpaySignature: "invalid"
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

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Payment already verified"
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an invalid Razorpay signature", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending",
      subtotal: 50,
      payment: {
        status: "pending",
        razorpayOrderId: "order_test123",
        transactionId: ""
      }
    };

    vi.spyOn(Order, "findOne").mockResolvedValue(order);

    const req = {
      params: {
        orderId: order._id
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_test123",
        razorpaySignature: "invalid_signature"
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

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_PAYMENT_SIGNATURE"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a mismatched Razorpay order ID", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending",
      subtotal: 50,
      payment: {
        status: "pending",
        razorpayOrderId: "order_correct123",
        transactionId: ""
      }
    };

    vi.spyOn(Order, "findOne").mockResolvedValue(order);

    const req = {
      params: {
        orderId: order._id
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_wrong123",
        razorpaySignature: "some_signature"
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

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_RAZORPAY_ORDER"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject a payment with an incorrect amount", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending",
      subtotal: 50,
      payment: {
        status: "pending",
        razorpayOrderId: "order_test123",
        transactionId: ""
      }
    };

    vi.spyOn(Order, "findOne").mockResolvedValue(order);

    const razorpay = await import("./razorpay.service.js");

    vi.spyOn(
      razorpay.default.payments,
      "fetch"
    ).mockResolvedValue({
      order_id: "order_test123",
      amount: 10000,
      currency: "INR",
      status: "captured"
    });

    const razorpaySignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update("order_test123|pay_test123")
      .digest("hex");

    const req = {
      params: {
        orderId: order._id
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_test123",
        razorpaySignature
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

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "PAYMENT_AMOUNT_MISMATCH"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });
});