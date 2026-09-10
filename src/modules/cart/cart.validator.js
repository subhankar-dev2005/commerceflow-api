import { z } from "zod";

const addToCartSchema = z.object({
body: z.object({
productId: z
.string()
.regex(
/^[0-9a-fA-F]{24}$/,
"Invalid product ID"
),

quantity: z
  .number()
  .int()
  .min(
    1,
    "Quantity must be at least 1"
  )

}),

query: z.object({}),

params: z.object({})
});

const updateCartItemSchema = z.object({
body: z.object({
quantity: z
.number()
.int()
.min(
1,
"Quantity must be at least 1"
)
}),

query: z.object({}),

params: z.object({
productId: z
.string()
.regex(
/^[0-9a-fA-F]{24}$/,
"Invalid product ID"
)
})
});

const removeCartItemSchema = z.object({
body: z.object({}),

query: z.object({}),

params: z.object({
productId: z
.string()
.regex(
/^[0-9a-fA-F]{24}$/,
"Invalid product ID"
)
})
});

export {
addToCartSchema,
updateCartItemSchema,
removeCartItemSchema
};
