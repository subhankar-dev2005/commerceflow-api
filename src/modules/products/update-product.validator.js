import { z } from "zod";

const productQuerySchema = z.object({
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
      .default(10)
  }),

  params: z.object({}).optional()
});

export default productQuerySchema;