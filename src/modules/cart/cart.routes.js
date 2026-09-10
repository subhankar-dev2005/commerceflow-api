import { Router } from "express";

import authMiddleware from "../../common/middleware/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";

import {
  addToCart
} from "./cart.controller.js";

import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema
} from "./cart.validator.js";

import getCart from "./get-cart.controller.js";
import { updateCartItem } from "./update-cart-item.controller.js";
import removeCartItem from "./remove-cart-item.controller.js";
import clearCart from "./clear-cart.controller.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getCart
);

router.post(
  "/items",
  authMiddleware,
  validate(addToCartSchema),
  addToCart
);

router.patch(
  "/items/:productId",
  authMiddleware,
  validate(updateCartItemSchema),
  updateCartItem
);

router.delete(
  "/items/:productId",
  authMiddleware,
  validate(removeCartItemSchema),
  removeCartItem
);

router.delete(
  "/",
  authMiddleware,
  clearCart
);

export default router;