
import { z } from "zod";

const createOrderSchema = z.object({
  body: z.object({
    addressId: z
      .string()
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid address ID"
      )
  }),

  query: z.object({}).optional(),

  params: z.object({}).optional()
});

const getOrdersSchema = z.object({
  body: z.object({}).optional(),

  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10),

    status: z
      .enum([
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ])
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc")
  }),

  params: z.object({}).optional()
});

const getOrderSchema = z.object({
  body: z.object({}).optional(),

  query: z.object({}).optional(),

  params: z.object({
    orderId: z
      .string()
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid order ID"
      )
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
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid order ID"
      )
  })
});

const cancelOrderSchema = z.object({
  body: z.object({}).optional(),

  query: z.object({}).optional(),

  params: z.object({
    orderId: z
      .string()
      .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid order ID"
      )
  })
});

export {
  createOrderSchema,
  getOrdersSchema,
  getOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
};
