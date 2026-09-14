import {
  describe,
  it,
  expect,
  vi,
  beforeEach
} from "vitest";

import crypto from "crypto";

import Order from "../orders/order.model.js";
import WebhookEvent from "./webhook-event.model.js";

import handleRazorpayWebhook from "./webhook.controller.js";

describe("handleRazorpayWebhook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(WebhookEvent, "create").mockResolvedValue({
      eventId: "evt_test123",
      provider: "razorpay",
      event: "payment.captured"
    });
  });

  it("should reject a webhook without a signature", async () => {
    const req = {
      headers: {},
      rawBody: Buffer.from(
        JSON.stringify({
          event: "payment.captured"
        })
      ),
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await handleRazorpayWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "MISSING_WEBHOOK_SIGNATURE"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should reject an invalid webhook signature", async () => {
    const req = {
      headers: {
        "x-razorpay-signature": "invalid_signature"
      },
      rawBody: Buffer.from(
        JSON.stringify({
          event: "payment.captured"
        })
      ),
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await handleRazorpayWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_WEBHOOK_SIGNATURE"
        })
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it("should process a valid payment.captured webhook", async () => {
    const rawBody = Buffer.from(
      JSON.stringify({
        id: "evt_test123",
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_test123",
              order_id: "order_test123"
            }
          }
        }
      })
    );

    const signature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest("hex");

    const order = {
      _id: "507f1f77bcf86cd799439011",
      status: "pending",
      payment: {
        status: "pending",
        transactionId: "",
        razorpayOrderId: "order_test123"
      },
      save: vi.fn().mockResolvedValue()
    };

    vi.spyOn(Order, "findOne").mockResolvedValue(order);

    const req = {
      headers: {
        "x-razorpay-signature": signature
      },
      rawBody,
      requestId: "test-request-id"
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    await handleRazorpayWebhook(req, res, next);

    expect(WebhookEvent.create).toHaveBeenCalledWith({
      eventId: "evt_test123",
      provider: "razorpay",
      event: "payment.captured"
    });

    expect(order.payment.status).toBe("paid");
    expect(order.payment.transactionId).toBe("pay_test123");
    expect(order.status).toBe("confirmed");

    expect(order.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(next).not.toHaveBeenCalled();
  });
});