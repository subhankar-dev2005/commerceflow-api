import Cart from "../cart/cart.model.js";

import Product from "../products/product.model.js";

import Order from "./order.model.js";

import AppError from "../../common/errors/app-error.js";

async function createOrder(
req,
res,
next
) {
try {
const cart =
await Cart.findOne({
user: req.user._id
}).populate(
"items.product"
);

if (
  !cart ||
  cart.items.length === 0
) {
  throw new AppError(
    "Cart is empty",
    400,
    [],
    "CART_EMPTY"
  );
}

const orderItems = [];

let totalQuantity = 0;

let subtotal = 0;

for (
  const cartItem of cart.items
) {
  const product =
    await Product.findOne({
      _id:
        cartItem.product._id,
      isActive:
        true
    });

  if (!product) {
    throw new AppError(
      "A product in the cart is no longer available",
      404,
      [],
      "PRODUCT_NOT_FOUND"
    );
  }

  if (
    product.stock <
    cartItem.quantity
  ) {
    throw new AppError(
      `Insufficient stock for ${product.name}`,
      400,
      [],
      "INSUFFICIENT_STOCK"
    );
  }

  const itemSubtotal =
    product.price *
    cartItem.quantity;

  orderItems.push({
    product:
      product._id,

    name:
      product.name,

    price:
      product.price,

    quantity:
      cartItem.quantity,

    subtotal:
      itemSubtotal
  });

  totalQuantity +=
    cartItem.quantity;

  subtotal +=
    itemSubtotal;
}

const order =
  await Order.create({
    user:
      req.user._id,

    items:
      orderItems,

    totalQuantity,

    subtotal,

    status:
      "pending"
  });

for (
  const item of orderItems
) {
  await Product.findByIdAndUpdate(
    item.product,
    {
      $inc: {
        stock:
          -item.quantity
      }
    }
  );
}

cart.items = [];

await cart.save();

return res
  .status(201)
  .json({
    success: true,

    message:
      "Order created successfully",

    data: {
      order
    },

    requestId:
      req.requestId
  });

} catch (error) {
next(error);
}
}

export {
createOrder
};
