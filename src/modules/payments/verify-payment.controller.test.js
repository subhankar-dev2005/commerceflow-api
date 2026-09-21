
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

import razorpay from "./razorpay.service.js";

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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("ORDER_NOT_FOUND");
    expect(error.message).toBe("Order not found");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
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

  it("should reject an invalid different-length signature with INVALID_PAYMENT_SIGNATURE", async () => {
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_PAYMENT_SIGNATURE");
    expect(error.message).toBe("Payment signature verification failed");
    expect(error.errors).toEqual([]);
    expect(JSON.stringify(error)).not.toContain("invalid_signature");
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject an invalid same-length signature", async () => {
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
        razorpaySignature: "a".repeat(64)
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_PAYMENT_SIGNATURE");
    expect(error.message).toBe("Payment signature verification failed");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject a missing signature with INVALID_PAYMENT_SIGNATURE", async () => {
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
        razorpayOrderId: "order_test123"
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_PAYMENT_SIGNATURE");
    expect(error.message).toBe("Payment signature verification failed");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("INVALID_RAZORPAY_ORDER");
    expect(error.message).toBe("Razorpay order does not match this order");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
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

    vi.spyOn(
      razorpay.payments,
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("PAYMENT_AMOUNT_MISMATCH");
    expect(error.message).toBe(
      "Payment amount or currency does not match the order"
    );
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject a payment belonging to a different Razorpay order", async () => {
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

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.payments, "fetch")
      .mockResolvedValue({
        id: "pay_test123",
        order_id: "order_different123",
        amount: 5000,
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

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("PAYMENT_ORDER_MISMATCH");
    expect(error.message).toBe(
      "Payment does not belong to this Razorpay order"
    );
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("accepts a valid signature and verifies payment successfully", async () => {
  const order = {
    _id: "507f1f77bcf86cd799439011",
    user: "user123",
    status: "pending",
    subtotal: 499,
    payment: {
      status: "pending",
      transactionId: "",
      razorpayOrderId: "order_test123"
    },
    save: vi.fn().mockResolvedValue(true)
  };

  vi.spyOn(Order, "findOne")
    .mockResolvedValue(order);

  const razorpayPaymentId = "pay_test123";
  const razorpayOrderId = "order_test123";

  const razorpaySignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(
      `${razorpayOrderId}|${razorpayPaymentId}`
    )
    .digest("hex");

  vi.spyOn(razorpay.payments, "fetch")
    .mockResolvedValue({
      id: razorpayPaymentId,
      order_id: razorpayOrderId,
      amount: 49900,
      currency: "INR",
      status: "captured"
    });

  const req = {
    params: {
      orderId: order._id
    },
    user: {
      _id: order.user
    },
    body: {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    },
    requestId: "test-request-id"
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };

  const next = vi.fn();

  await verifyPayment(req, res, next);

  expect(next).not.toHaveBeenCalled();

  expect(res.status).toHaveBeenCalledWith(200);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      message: "Payment verified successfully",
      requestId: "test-request-id"
    })
  );

  expect(order.payment.status).toBe("paid");
  expect(order.payment.transactionId)
    .toBe(razorpayPaymentId);

  expect(order.status).toBe("confirmed");

  expect(order.save).toHaveBeenCalled();
});

  it("should reject a payment that is not captured", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "pending",
      subtotal: 499,
      payment: {
        status: "pending",
        razorpayOrderId: "order_test123"
      }
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    vi.spyOn(razorpay.payments, "fetch")
      .mockResolvedValue({
        id: "pay_test123",
        order_id: "order_test123",
        amount: 49900,
        currency: "INR",
        status: "failed"
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
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_test123",
        razorpaySignature
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await verifyPayment(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("PAYMENT_NOT_CAPTURED");
    expect(error.message).toBe("Payment has not been captured");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject payment verification for a cancelled order", async () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      user: "507f1f77bcf86cd799439012",
      status: "cancelled",
      payment: {
        status: "pending",
        razorpayOrderId: "order_test123"
      }
    };

    vi.spyOn(Order, "findOne")
      .mockResolvedValue(order);

    const req = {
      params: {
        orderId: "507f1f77bcf86cd799439011"
      },
      user: {
        _id: "507f1f77bcf86cd799439012"
      },
      body: {
        razorpayPaymentId: "pay_test123",
        razorpayOrderId: "order_test123",
        razorpaySignature: "test_signature"
      },
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await verifyPayment(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("ORDER_CANCELLED");
    expect(error.message).toBe("Cannot verify payment for a cancelled order");
    expect(error.errors).toEqual([]);
    expect(res.status).not.toHaveBeenCalled();
  });
});
