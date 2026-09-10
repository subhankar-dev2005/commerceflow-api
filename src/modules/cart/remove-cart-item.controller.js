import Cart from "./cart.model.js";

import AppError from "../../common/errors/app-error.js";

async function removeCartItem(
  req,
  res,
  next
) {
  try {
    const {
      productId
    } = req.params;

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

    const existingItem =
      cart.items.find(
        (item) =>
          item.product.toString() ===
          productId
      );

    if (!existingItem) {
      throw new AppError(
        "Product not found in cart",
        404,
        [],
        "CART_ITEM_NOT_FOUND"
      );
    }

    cart.items =
      cart.items.filter(
        (item) =>
          item.product.toString() !==
          productId
      );

    await cart.save();

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Product removed from cart successfully",

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

export default removeCartItem;