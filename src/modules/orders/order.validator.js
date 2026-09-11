
import { z } from "zod";

const createOrderSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const getOrderSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID")
  })
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(
      [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      {
        message: "Invalid order status"
      }
    )
  }),
  query: z.object({}).optional(),
  params: z.object({
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID")
  })
});

const cancelOrderSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    orderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID")
  })
});

export {
  createOrderSchema,
  getOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
};
