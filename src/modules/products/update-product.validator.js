import { z } from "zod";

const updateProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .optional(),

    description: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .optional(),

    price: z
      .number()
      .positive()
      .optional(),

    stock: z
      .number()
      .int()
      .min(0)
      .optional(),

    category: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    image: z
      .string()
      .trim()
      .url()
      .nullable()
      .optional()
  }),

  query: z.object({}),

  params: z.object({
    id: z.string()
  })
});

export default updateProductSchema;