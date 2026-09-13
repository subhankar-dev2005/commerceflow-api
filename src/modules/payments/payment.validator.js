import { z } from "zod";

const paymentOrderSchema = z.object({
  body: z.object({}).optional(),

  query: z.object({}).optional(),

  params: z.object({
    orderId: z.string().regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid order ID"
    )
  })
});

export {
  paymentOrderSchema
};
