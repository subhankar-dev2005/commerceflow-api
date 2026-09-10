import { z } from "zod";

const createOrderSchema = z.object({
body: z.object({}),
query: z.object({}),
params: z.object({})
});

const getOrderSchema = z.object({
body: z.object({}),
query: z.object({}),
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

query: z.object({}),

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

  query: z.object({}),

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
  getOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
};
