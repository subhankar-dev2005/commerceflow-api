import Cart from "./cart.model.js";

import Product from "../products/product.model.js";

import AppError from "../../common/errors/app-error.js";

async function addToCart(
req,
res,
next
) {
try {
const {
productId,
quantity
} = req.body;

const product =
  await Product.findOne({
    _id: productId,
    isActive: true
  });

if (!product) {
  throw new AppError(
    "Product not found",
    404,
    [],
    "PRODUCT_NOT_FOUND"
  );
}

if (product.stock < quantity) {
  throw new AppError(
    "Insufficient product stock",
    400,
    [],
    "INSUFFICIENT_STOCK"
  );
}

let cart =
  await Cart.findOne({
    user: req.user._id
  });

if (!cart) {
  cart =
    await Cart.create({
      user: req.user._id,
      items: [
        {
          product: productId,
          quantity
        }
      ]
    });
} else {
  const existingItem =
    cart.items.find(
      (item) =>
        item.product.toString() ===
        productId
    );

  if (existingItem) {
    const newQuantity =
      existingItem.quantity +
      quantity;

    if (
      product.stock <
      newQuantity
    ) {
      throw new AppError(
        "Insufficient product stock",
        400,
        [],
        "INSUFFICIENT_STOCK"
      );
    }

    existingItem.quantity =
      newQuantity;
  } else {
    cart.items.push({
      product: productId,
      quantity
    });
  }

  await cart.save();
}

return res
  .status(200)
  .json({
    success: true,

    message:
      "Product added to cart successfully",

    data: {
      cart
    },

    requestId:
      req.requestId
  });

} catch (error) {
next(error);
}
}
async function updateCartItem(
  req,
  res,
  next
) {
  try {
    const {
      productId
    } = req.params;

    const {
      quantity
    } = req.body;

    const cart =
      await Cart.findOne({
        user: req.user._id
      });

    if (!cart) {
      throw new AppError(
        "Cart not found",
        404,
        [],
        "CART_NOT_FOUND"
      );
    }

    const cartItem =
      cart.items.find(
        (item) =>
          item.product.toString() ===
          productId
      );

    if (!cartItem) {
      throw new AppError(
        "Product not found in cart",
        404,
        [],
        "CART_ITEM_NOT_FOUND"
      );
    }

    const product =
      await Product.findOne({
        _id: productId,
        isActive: true
      });

    if (!product) {
      throw new AppError(
        "Product not found",
        404,
        [],
        "PRODUCT_NOT_FOUND"
      );
    }

    if (
      product.stock <
      quantity
    ) {
      throw new AppError(
        "Insufficient product stock",
        400,
        [],
        "INSUFFICIENT_STOCK"
      );
    }

    cartItem.quantity =
      quantity;

    await cart.save();

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Cart item updated successfully",

        data: {
          cart
        },

        requestId:
          req.requestId
      });
  } catch (error) {
    next(error);
  }
}

export {
  addToCart,
  updateCartItem
};
