import { z } from "zod";

const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Product name must contain at least 2 characters"
      )
      .max(
        200,
        "Product name cannot exceed 200 characters"
      ),

    description: z
      .string()
      .trim()
      .min(
        10,
        "Description must contain at least 10 characters"
      ),

    price: z
      .number()
      .min(
        0,
        "Price cannot be negative"
      ),

    stock: z
      .number()
      .int(
        "Stock must be a whole number"
      )
      .min(
        0,
        "Stock cannot be negative"
      ),

    category: z
      .string()
      .trim()
      .min(
        2,
        "Category must contain at least 2 characters"
      ),

    image: z
      .string()
      .trim()
      .url(
        "Image must be a valid URL"
      )
      .optional()
  }),

  query: z.object({}),

  params: z.object({})
});

export default createProductSchema;