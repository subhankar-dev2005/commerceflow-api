import { z } from "zod";

const productQuerySchema = z.object({
query: z.object({
page: z
.string()
.optional()
.transform((value) =>
value ? Number(value) : 1
)
.pipe(
z.number()
.int()
.min(1)
),

limit: z
  .string()
  .optional()
  .transform((value) =>
    value ? Number(value) : 10
  )
  .pipe(
    z.number()
      .int()
      .min(1)
      .max(100)
  ),

category: z
  .string()
  .trim()
  .min(1)
  .optional(),

search: z
  .string()
  .trim()
  .min(1)
  .optional(),

inStock: z
  .enum([
    "true",
    "false"
  ])
  .optional(),

minPrice: z
  .string()
  .optional()
  .transform((value) =>
    value !== undefined
      ? Number(value)
      : undefined
  )
  .pipe(
    z.number()
      .positive()
      .optional()
  ),

maxPrice: z
  .string()
  .optional()
  .transform((value) =>
    value !== undefined
      ? Number(value)
      : undefined
  )
  .pipe(
    z.number()
      .positive()
      .optional()
  ),

sortBy: z
  .enum([
    "price",
    "createdAt",
    "name"
  ])
  .optional(),

sortOrder: z
  .enum([
    "asc",
    "desc"
  ])
  .optional()

})
});

export default productQuerySchema;
