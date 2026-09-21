import { describe, it, expect } from "vitest";
import Order from "./order.model.js";

describe("Order Schema Indexes", () => {
  it("defines expected indexes on order schema", () => {
    const indexes = Order.schema.indexes();

    expect(indexes).toContainEqual([
      { user: 1, createdAt: -1 },
      {}
    ]);

    expect(indexes).toContainEqual([
      { user: 1, status: 1, createdAt: -1 },
      {}
    ]);

    expect(indexes).toContainEqual([
      { "payment.razorpayOrderId": 1 },
      {}
    ]);
  });
});
