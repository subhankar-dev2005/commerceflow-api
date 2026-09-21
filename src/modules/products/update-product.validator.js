import { z } from "zod";

const updateProductSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Product name must contain at least 2 characters")
        .max(200, "Product name cannot exceed 200 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .min(10, "Description must contain at least 10 characters")
        .optional(),

      price: z
        .number()
        .min(0, "Price cannot be negative")
        .optional(),

      stock: z
        .number()
        .int("Stock must be a whole number")
        .min(0, "Stock cannot be negative")
        .optional(),

      category: z
        .string()
        .trim()
        .min(2, "Category must contain at least 2 characters")
        .optional(),

      image: z
        .string()
        .trim()
        .url("Image must be a valid URL")
        .optional(),

      isActive: z
        .boolean()
        .optional()
    })
    .strict("Unsupported fields in update payload")
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field is required to update"
      }
    ),

  query: z.object({}).optional(),

  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID")
  })
});

export default updateProductSchema;